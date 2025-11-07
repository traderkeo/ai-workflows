import React, { useMemo, useState, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { Bot, Play, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { BaseAINode } from '../../components/BaseAINode';
import { useFlowStore } from '../../hooks/useFlowStore';
import { resolveVariables, getAvailableVariables } from '../../utils/variableResolver';
import type { AIAgentNodeData } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { useDebouncedNodeUpdate } from '../../hooks/useDebouncedNodeUpdate';
import { SettingsDialog } from './SettingsDialog';

export const AIAgentNodeV6: React.FC<NodeProps> = (props) => {
  const data = props.data as AIAgentNodeData;
  const debouncedUpdate = useDebouncedNodeUpdate(props.id, 300);
  const updateNode = useFlowStore((state) => state.updateNode);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);

  const [isRunning, setIsRunning] = useState(false);
  const [streamingText, setStreamingText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [useStreaming, setUseStreaming] = useState<boolean>(false);
  const [newUserMessage, setNewUserMessage] = useState<string>('');
  const [useReasoning, setUseReasoning] = useState<boolean>(false);
  const [reasoningText, setReasoningText] = useState<string>('');

  // Local state for debounced inputs
  const [localPrompt, setLocalPrompt] = useState(data.prompt || '');
  const [localInstructions, setLocalInstructions] = useState(data.instructions || '');

  useEffect(() => setLocalPrompt(data.prompt || ''), [data.prompt]);
  useEffect(() => setLocalInstructions(data.instructions || ''), [data.instructions]);

  const handleDelete = () => {
    if (confirm('Delete this node?')) deleteNode(props.id);
  };

  const availableVariables = useMemo(
    () => getAvailableVariables(props.id, nodes, edges),
    [props.id, nodes, edges]
  );

  const handleRun = async () => {
    setError('');
    setStreamingText('');
    const prompt = resolveVariables(data.prompt || '', props.id, nodes, edges);
    const systemPrompt = data.instructions
      ? resolveVariables(data.instructions, props.id, nodes, edges)
      : '';
    if (!prompt.trim()) {
      alert('Please enter a prompt first');
      return;
    }
    setIsRunning(true);
    updateNode(props.id, { status: 'running' });
    try {
      const endpoint = useStreaming ? '/api/workflows/agent/stream' : '/api/workflows/agent';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: data.model || 'gpt-4o-mini',
          temperature: data.temperature ?? 0.7,
          systemPrompt,
          messages: data.messages || [],
          tools: {
            calculator: !!data.tools?.calculator,
            search: !!data.tools?.search,
            dateTime: !!data.tools?.dateTime,
          },
          customTools: data.customTools || [],
          reasoning: useReasoning,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Agent request failed');
      }
      if (useStreaming && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const dataLine = line.slice(6).trim();
            if (!dataLine || dataLine === '[DONE]') continue;
            try {
              const evt = JSON.parse(dataLine);
              if (evt.error) throw new Error(evt.error);
              if (evt.delta) {
                full += evt.delta;
                setStreamingText(full);
              }
              if (evt.reasoningDelta) {
                setReasoningText((prev) => prev + evt.reasoningDelta);
              }
              if (evt.step && evt.toolCalls) {
                updateNode(props.id, { toolCalls: evt.toolCalls });
              }
              if (evt.done) {
                setStreamingText(evt.text || full);
                updateNode(props.id, {
                  result: evt.text || full,
                  usage: evt.usage,
                  status: 'success',
                });
                if ((data.appendAssistantToHistory ?? true) && (evt.text || full)) {
                  const msgs = [
                    ...(data.messages || []),
                    { role: 'assistant' as const, content: evt.text || full },
                  ];
                  updateNode(props.id, { messages: msgs });
                }
              }
            } catch {}
          }
        }
      } else {
        const j = await res.json();
        setStreamingText(j.text || '');
        updateNode(props.id, {
          result: j.text,
          usage: j.usage,
          toolCalls: j.toolCalls,
          status: 'success',
        });
        if ((data.appendAssistantToHistory ?? true) && j.text) {
          const msgs = [...(data.messages || []), { role: 'assistant' as const, content: j.text }];
          updateNode(props.id, { messages: msgs });
        }
      }
    } catch (e: any) {
      setError(e.message);
      updateNode(props.id, { status: 'error', error: e.message });
    } finally {
      setIsRunning(false);
    }
  };

  const status = (data.status || 'idle') as any;

  // Footer with status + usage
  const customFooter = (data.executionTime !== undefined || data.usage) && (
    <div
      className="ai-node-footer"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        paddingBottom: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <StatusBadge status={status} />
        {data.executionTime !== undefined && (
          <span style={{ fontSize: 10, color: '#888' }}>Execution Time: {data.executionTime}ms</span>
        )}
      </div>
      {data.usage && (
        <div style={{ fontSize: 11, color: 'var(--cyber-neon-purple)' }}>
          {(data.usage.totalTokens ?? 0).toLocaleString()} tokens
        </div>
      )}
    </div>
  );

  return (
    <BaseAINode {...props} data={data} icon={<Bot size={20} />} footerContent={customFooter}>
      {/* Compact Prompt Display */}
      <div className="ai-node-field">
        <label className="ai-node-field-label">Quick Prompt</label>
        <textarea
          className="ai-node-input ai-node-textarea nodrag"
          rows={3}
          value={localPrompt}
          onChange={(e) => {
            setLocalPrompt(e.target.value);
            debouncedUpdate({ prompt: e.target.value });
          }}
          placeholder="Ask the agent... Use variables like {{input}}"
        />
        {availableVariables.length > 0 && (
          <div style={{ marginTop: 4, color: '#888', fontSize: 10 }}>
            Available variables: {availableVariables.join(', ')}
          </div>
        )}
      </div>

      {/* Results Section - Only show when there's content */}
      {(streamingText || error || data.toolCalls?.length) && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Result</label>
          <div
            className="ai-node-field-value"
            style={{
              maxHeight: 180,
              overflowY: 'auto',
              padding: 8,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 4,
              border: '1px solid rgba(176,38,255,0.3)',
            }}
          >
            {isRunning && (
              <div style={{ color: '#9cf', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={14} className="animate-spin" /> Running…
              </div>
            )}
            {error && <div style={{ color: '#ff6b6b' }}>Error: {error}</div>}
            {streamingText && <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{streamingText}</pre>}
            {!!data.toolCalls?.length && (
              <div style={{ marginTop: 8, fontSize: 12 }}>
                <div style={{ color: '#bbb', marginBottom: 4 }}>Tool calls:</div>
                {data.toolCalls.map((t: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      padding: '6px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 6,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ color: '#0ff' }}>{t.toolName || t.name}</div>
                    {t.args && <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(t.args, null, 2)}</pre>}
                    {t.result && (
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(t.result, null, 2)}</pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {useReasoning && reasoningText && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Reasoning Traces</label>
          <div
            className="ai-node-field-value"
            style={{
              maxHeight: 140,
              overflowY: 'auto',
              padding: 8,
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 6,
              border: '1px solid rgba(176,38,255,0.2)',
              fontFamily: 'var(--font-geist-mono, monospace)',
              fontSize: 12,
            }}
          >
            {reasoningText || <span style={{ color: '#888' }}>No reasoning events received.</span>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="ai-node-field" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button onClick={handleRun} disabled={isRunning} variant="success" className="flex-1">
          <Play size={14} /> {isRunning ? 'Running…' : 'Run'}
        </Button>
        <SettingsDialog
          data={data}
          nodeId={props.id}
          updateNode={updateNode}
          localPrompt={localPrompt}
          setLocalPrompt={setLocalPrompt}
          localInstructions={localInstructions}
          setLocalInstructions={setLocalInstructions}
          debouncedUpdate={debouncedUpdate}
          availableVariables={availableVariables}
          newUserMessage={newUserMessage}
          setNewUserMessage={setNewUserMessage}
        />
        <Button onClick={handleDelete} variant="outline">
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Optional: Streaming & Reasoning toggles */}
      <div className="ai-node-field" style={{ display: 'flex', gap: 12, fontSize: 11, marginTop: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={useStreaming} onChange={(e) => setUseStreaming(e.target.checked)} />
          <span>Streaming</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={useReasoning} onChange={(e) => setUseReasoning(e.target.checked)} />
          <span>Show Reasoning</span>
        </label>
      </div>
    </BaseAINode>
  );
};

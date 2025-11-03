import React, { useState, useMemo } from 'react';
import { NodeProps } from '@xyflow/react';
import { MessageSquare, Play, X, Trash2, Info } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables, getAvailableVariables } from '../utils/variableResolver';
import type { TextGenerationNodeData } from '../types';

export const TextGenerationNode: React.FC<NodeProps> = (props) => {
  const data = props.data as TextGenerationNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [showVariables, setShowVariables] = useState(false);

  const availableVariables = useMemo(
    () => getAvailableVariables(props.id, nodes, edges),
    [props.id, nodes, edges]
  );

  const handleChange = (field: keyof TextGenerationNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const handleDelete = () => {
    if (confirm('Delete this node?')) {
      deleteNode(props.id);
    }
  };

  const handleTest = async () => {
    if (!data.prompt?.trim()) {
      alert('Please enter a prompt first');
      return;
    }

    setIsTesting(true);
    setTestResult('');

    try {
      // Resolve all variables in the prompt
      const resolvedPrompt = resolveVariables(data.prompt, props.id, nodes, edges);
      const resolvedSystemPrompt = data.systemPrompt
        ? resolveVariables(data.systemPrompt, props.id, nodes, edges)
        : undefined;

      // Call server-side API
      const response = await fetch('/api/workflows/test-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeType: 'text-generation',
          config: {
            prompt: resolvedPrompt,
            model: data.model || 'gpt-4o-mini',
            temperature: data.temperature ?? 0.7,
            maxTokens: data.maxTokens ?? 1000,
            systemPrompt: resolvedSystemPrompt,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.fullText) {
              setTestResult(data.fullText);
            }

            if (data.done) {
              setTestResult(data.text || data.fullText || '');
            }
          }
        }
      }
    } catch (error: any) {
      setTestResult(`Error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <BaseAINode {...props} data={data} icon={<MessageSquare size={20} />}>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Prompt</label>
        <textarea
          className="ai-node-input ai-node-textarea"
          value={data.prompt || ''}
          onChange={(e) => handleChange('prompt', e.target.value)}
          placeholder="Enter your prompt..."
          rows={4}
        />
        {availableVariables.length > 0 && (
          <div style={{ marginTop: '4px' }}>
            <button
              onClick={() => setShowVariables(!showVariables)}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 0'
              }}
            >
              <Info size={12} />
              {showVariables ? 'Hide' : 'Show'} available variables ({availableVariables.length})
            </button>
            {showVariables && (
              <div style={{
                marginTop: '4px',
                padding: '6px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                fontSize: '10px',
                color: '#888',
                maxHeight: '100px',
                overflowY: 'auto'
              }}>
                {availableVariables.map((v, i) => (
                  <div key={i} style={{ padding: '2px 0', fontFamily: 'monospace' }}>
                    {v}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ai-node-field">
        <label className="ai-node-field-label">Model</label>
        <select
          className="ai-node-select"
          value={data.model || 'gpt-4o-mini'}
          onChange={(e) => handleChange('model', e.target.value)}
        >
          <optgroup label="OpenAI">
            <option value="gpt-4o">GPT-4o (Most Capable)</option>
            <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </optgroup>
          <optgroup label="Anthropic">
            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Latest)</option>
            <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</option>
            <option value="claude-3-opus-20240229">Claude 3 Opus</option>
            <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
            <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
          </optgroup>
          <optgroup label="Google">
            <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B</option>
          </optgroup>
        </select>
      </div>

      <div className="ai-node-field">
        <label className="ai-node-field-label">Temperature</label>
        <input
          type="number"
          className="ai-node-input"
          value={data.temperature ?? 0.7}
          onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
          min="0"
          max="2"
          step="0.1"
        />
      </div>

      <div className="ai-node-field">
        <label className="ai-node-field-label">Max Tokens</label>
        <input
          type="number"
          className="ai-node-input"
          value={data.maxTokens ?? 1000}
          onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
          min="1"
          max="4000"
        />
      </div>

      {data.systemPrompt !== undefined && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">System Prompt</label>
          <textarea
            className="ai-node-input ai-node-textarea"
            value={data.systemPrompt || ''}
            onChange={(e) => handleChange('systemPrompt', e.target.value)}
            placeholder="Optional system prompt..."
            rows={2}
          />
        </div>
      )}

      {(data.streamingText || data.result) && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">
            {data.isStreaming ? 'Streaming...' : 'Result'}
          </label>
          <div className="ai-node-field-value" style={{
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: data.isStreaming
              ? '1px solid rgba(59, 130, 246, 0.5)'
              : '1px solid rgba(176, 38, 255, 0.3)',
            position: 'relative'
          }}>
            {data.streamingText || data.result}
            {data.isStreaming && (
              <span style={{
                display: 'inline-block',
                width: '2px',
                height: '16px',
                marginLeft: '2px',
                background: '#3b82f6',
                animation: 'blink 1s infinite'
              }} />
            )}
          </div>
        </div>
      )}

      {data.usage && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Token Usage</label>
          <div className="ai-node-field-value">
            {data.usage.totalTokens} tokens (
            {data.usage.promptTokens} prompt + {data.usage.completionTokens} completion)
          </div>
        </div>
      )}

      {testResult && (
        <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
          <label className="ai-node-field-label" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>Test Result</label>
          <div className="ai-node-field-value" style={{
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: isTesting
              ? '1px solid rgba(34, 197, 94, 0.5)'
              : '1px solid rgba(34, 197, 94, 0.3)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}>
            {testResult}
          </div>
        </div>
      )}

      <div className="ai-node-field" style={{ display: 'flex', gap: '8px', marginTop: '8px', fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
        <button
          onClick={handleTest}
          disabled={isTesting}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: isTesting ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.3)',
            border: '1px solid rgba(34, 197, 94, 0.5)',
            borderRadius: '4px',
            color: '#fff',
            cursor: isTesting ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <Play size={14} />
          {isTesting ? 'Testing...' : 'Test'}
        </button>
        <button
          onClick={handleDelete}
          style={{
            padding: '8px 12px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </BaseAINode>
  );
};

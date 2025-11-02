import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Bot, Play, Trash2, Settings, Loader2 } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables } from '../utils/variableResolver';
import { Button } from '../components/ui/Button';
import { AIAgentSettingsDialog } from '../components/AIAgentSettingsDialog';
import type { AIAgentNodeData } from '../types';

export const AIAgentNode: React.FC<NodeProps> = (props) => {
  const data = props.data as AIAgentNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleChange = (field: keyof AIAgentNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const handleDelete = () => {
    if (confirm('Delete this node?')) {
      deleteNode(props.id);
    }
  };

  const buildZodSchema = () => {
    const fields = (data.schemaFields || []).filter(f => f.name.trim());
    if (fields.length === 0) return null;

    const schemaObj: Record<string, any> = {};
    fields.forEach(field => {
      schemaObj[field.name] = {
        type: field.type,
        description: field.description || undefined
      };
    });
    return schemaObj;
  };

  const handleTest = async () => {
    if (!data.prompt?.trim()) {
      alert('Please enter a prompt first');
      return;
    }

    const mode = data.mode || 'text';

    if (mode === 'structured') {
      const schema = buildZodSchema();
      if (!schema) {
        alert('Please define at least one schema field for structured mode');
        return;
      }
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const resolvedPrompt = resolveVariables(data.prompt, props.id, nodes, edges);
      const resolvedInstructions = data.instructions
        ? resolveVariables(data.instructions, props.id, nodes, edges)
        : undefined;

      if (mode === 'text') {
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
              systemPrompt: resolvedInstructions,
            },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Request failed');
        }

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
      } else {
        const schema = buildZodSchema();
        const response = await fetch('/api/workflows/test-node', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeType: 'structured-data',
            config: {
              prompt: resolvedPrompt,
              schema: schema,
              schemaName: data.schemaName || 'GeneratedData',
              schemaDescription: data.schemaDescription || 'Structured data schema',
              model: data.model || 'gpt-4o-mini',
              temperature: data.temperature ?? 0.7,
            },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Request failed');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Generation failed');
        }

        setTestResult(result.object);
      }
    } catch (error: any) {
      setTestResult({ error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  const mode = data.mode || 'text';
  const model = data.model || 'gpt-4o-mini';
  const status = data.status || 'idle';

  // Status colors and labels
  const statusColors: Record<string, string> = {
    idle: '#4a4a5a',
    running: '#00f0ff',
    success: '#39ff14',
    error: '#ff0040',
    warning: '#ffff00',
  };

  const statusLabels: Record<string, string> = {
    idle: 'Idle',
    running: 'Running',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
  };

  const statusColor = statusColors[status];

  // Format model name for display
  const getModelDisplayName = (modelId: string) => {
    const modelMap: Record<string, string> = {
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
      'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-haiku-20240307': 'Claude 3 Haiku',
      'gemini-2.5-pro': 'Gemini 2.5 Pro',
      'gemini-2.5-flash': 'Gemini 2.5 Flash',
      'gemini-2.0-flash': 'Gemini 2.0 Flash',
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'gemini-1.5-flash-8b': 'Gemini 1.5 Flash 8B',
    };
    return modelMap[modelId] || modelId;
  };

  // Custom footer with status badge, execution time, and tokens
  const customFooter = (data.executionTime !== undefined || data.usage) && (
    <div className="ai-node-footer" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      paddingTop: '10px',
      paddingBottom: '10px',
      fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)',
    }}>
      {/* Group badge + execution time together */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            color: statusColor,
            borderColor: statusColor,
            boxShadow: `0 0 5px ${statusColor}`,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontWeight: 500,
            padding: '3px 8px',
            border: '1px solid',
            borderRadius: '4px',
            fontFamily: 'inherit',
            letterSpacing: '0.01em',
          }}
        >
          {status === 'running' && <Loader2 size={10} className="animate-spin" />}
          {statusLabels[status]}
        </div>
        {data.executionTime !== undefined && (
          <span style={{ 
            fontSize: '10px', 
            fontWeight: 400,
            color: 'var(--text-muted, #888)',
            fontFamily: 'inherit',
            letterSpacing: '0.01em',
          }}>
            Execution Time: {data.executionTime}ms
          </span>
        )}
      </div>
      {/* Tokens on the right with more spacing - only show total */}
      {data.usage && (
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 500,
          color: 'var(--cyber-neon-purple)', 
          fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
          letterSpacing: '0.02em',
        }}>
          {(data.usage.totalTokens ?? 0).toLocaleString()} tokens
        </div>
      )}
    </div>
  );

  // Truncate prompt for preview
  const promptPreview = data.prompt
    ? data.prompt.length > 100
      ? data.prompt.substring(0, 100) + '...'
      : data.prompt
    : 'No prompt configured';

  return (
    <BaseAINode {...props} data={data} icon={<Bot size={20} />} footerContent={customFooter}>
      {/* Info Row - Mode and Model buttons with Configure button */}
      <div className="ai-node-field flex items-center gap-2 justify-between" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)' }}>
        <div className="flex items-center gap-2">
          <button
            disabled
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              mode === 'text'
                ? 'bg-cyan-600/40 text-cyan-300 border border-cyan-500/50'
                : 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
            }`}
            style={{
              fontWeight: 600,
              letterSpacing: '0.05em',
              fontFamily: 'inherit',
            }}
          >
            {mode === 'text' ? 'TEXT' : 'STRUCTURED'}
          </button>
          <button
            disabled
            className="text-xs px-3 py-1.5 rounded-md bg-purple-600/20 text-purple-300 border border-purple-500/30"
            style={{
              fontWeight: 500,
              letterSpacing: '0.02em',
              fontFamily: 'inherit',
            }}
          >
            {getModelDisplayName(model).toUpperCase()}
          </button>
        </div>
        <AIAgentSettingsDialog data={data} onUpdate={handleChange}>
          <button
            style={{
              padding: '4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--cyber-neon-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.7,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            title="Configure"
          >
            <Settings size={14} />
          </button>
        </AIAgentSettingsDialog>
      </div>

      {/* Prompt Preview */}
      <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)' }}>
        <div className="text-xs text-zinc-400 mb-1.5" style={{ fontWeight: 500, letterSpacing: '0.01em' }}>Prompt</div>
        <div className="px-3 py-2 bg-black/20 rounded-md border border-purple-500/20 text-[13px] leading-relaxed text-zinc-300 min-h-[44px] max-h-[80px] overflow-y-auto" style={{ 
          fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
          fontWeight: 400,
          letterSpacing: '0.01em',
        }}>
          {data.prompt ? (
            <span className="whitespace-pre-wrap break-words">{promptPreview}</span>
          ) : (
            <span className="italic text-zinc-500" style={{ fontWeight: 400 }}>No prompt configured</span>
          )}
        </div>
      </div>

      {/* Result Display */}
      {(data.streamingText || data.result) && (
        <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)' }}>
          <div className="text-xs text-zinc-400 mb-1.5" style={{ fontWeight: 500, letterSpacing: '0.01em' }}>
            {data.isStreaming ? 'Streaming...' : 'Result'}
          </div>
          <div className="max-h-[120px] overflow-y-auto px-3 py-2 bg-black/30 rounded-md border border-purple-500/30 text-[13px] text-zinc-200" style={{
            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}>
            <pre className="whitespace-pre-wrap break-words m-0" style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}>
              {mode === 'structured' && typeof data.result === 'object'
                ? JSON.stringify(data.result, null, 2)
                : (data.streamingText || data.result)}
            </pre>
          </div>
        </div>
      )}


      {/* Test Result */}
      {testResult && (
        <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)' }}>
          <div className="text-xs text-zinc-400 mb-1.5" style={{ fontWeight: 500, letterSpacing: '0.01em' }}>Test Result</div>
          <div className="max-h-[120px] overflow-y-auto px-3 py-2 bg-black/30 rounded-md border border-green-500/30 text-[13px] text-zinc-200" style={{
            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}>
            <pre className="whitespace-pre-wrap break-words m-0" style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}>
              {typeof testResult === 'object'
                ? JSON.stringify(testResult, null, 2)
                : testResult}
            </pre>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="ai-node-field flex items-center gap-2">
        <Button
          onClick={handleTest}
          disabled={isTesting}
          variant="success"
          size="sm"
          className="flex-1 rounded-full"
        >
          <Play size={14} />
          {isTesting ? 'Testing...' : 'Test'}
        </Button>

        <Button
          onClick={handleDelete}
          variant="ghost"
          size="icon"
          className="shrink-0"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </BaseAINode>
  );
};

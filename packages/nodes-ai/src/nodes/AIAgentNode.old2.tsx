import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Bot, Play, Trash2 } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables } from '../utils/variableResolver';
import { Badge } from '../components/ui/Badge';
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

  // Truncate prompt for preview
  const promptPreview = data.prompt
    ? data.prompt.length > 100
      ? data.prompt.substring(0, 100) + '...'
      : data.prompt
    : 'No prompt set';

  return (
    <BaseAINode {...props} data={data} icon={<Bot size={20} />}>
      {/* Info Badges */}
      <div className="ai-node-field" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <Badge variant="secondary">{mode === 'text' ? 'Text' : 'Structured'}</Badge>
        <Badge variant="outline">{getModelDisplayName(model)}</Badge>
      </div>

      {/* Prompt Preview */}
      <div className="ai-node-field">
        <label className="ai-node-field-label">Prompt</label>
        <div
          style={{
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            border: '1px solid rgba(176, 38, 255, 0.2)',
            fontSize: '11px',
            color: data.prompt ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontStyle: data.prompt ? 'normal' : 'italic',
            minHeight: '40px',
            maxHeight: '80px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {promptPreview}
        </div>
      </div>

      {/* Result Display */}
      {(data.streamingText || data.result) && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">
            {data.isStreaming ? 'Streaming...' : 'Result'}
          </label>
          <div
            style={{
              maxHeight: '120px',
              overflowY: 'auto',
              padding: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              border: data.isStreaming
                ? '1px solid rgba(59, 130, 246, 0.5)'
                : '1px solid rgba(176, 38, 255, 0.3)',
              whiteSpace: mode === 'structured' ? 'pre' : 'pre-wrap',
              fontFamily: mode === 'structured' ? 'var(--font-mono)' : 'inherit',
              fontSize: '11px',
            }}
          >
            {mode === 'structured' && typeof data.result === 'object'
              ? JSON.stringify(data.result, null, 2)
              : (data.streamingText || data.result)}
          </div>
        </div>
      )}

      {/* Token Usage */}
      {data.usage && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Tokens</label>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {data.usage.totalTokens} ({data.usage.promptTokens} + {data.usage.completionTokens})
          </div>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Test Result</label>
          <div
            style={{
              maxHeight: '120px',
              overflowY: 'auto',
              padding: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              border: isTesting
                ? '1px solid rgba(59, 130, 246, 0.5)'
                : '1px solid rgba(34, 197, 94, 0.3)',
              whiteSpace: 'pre-wrap',
              fontSize: '11px',
              fontFamily: mode === 'structured' ? 'var(--font-mono)' : 'inherit',
            }}
          >
            {typeof testResult === 'object'
              ? JSON.stringify(testResult, null, 2)
              : testResult}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="ai-node-field" style={{ display: 'flex', gap: '8px' }}>
        <AIAgentSettingsDialog data={data} onUpdate={handleChange} />
        <button
          onClick={handleTest}
          disabled={isTesting}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: isTesting ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.3)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            borderRadius: '4px',
            color: '#fff',
            cursor: isTesting ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Play size={12} />
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
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </BaseAINode>
  );
};

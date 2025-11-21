import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { MessageSquare, Database, Play } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables } from '../utils/variableResolver';
import { Button } from '../components/ui/Button';
import type { GenerateNodeData } from '../types';

const GenerateNodeComponent: React.FC<NodeProps> = (props) => {
  const data = props.data as GenerateNodeData;
  const updateNode = useFlowStore((s) => s.updateNode);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | object>('');

  const mode = data.mode || 'text';

  const handleChange = (field: keyof GenerateNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };


  const buildSchemaObject = () => {
    const fields = (data.schemaFields || []).filter((f) => f.name?.trim());
    if (fields.length === 0) return null;
    const obj: Record<string, any> = {};
    fields.forEach((f) => {
      obj[f.name] = f.type || 'string';
    });
    return obj;
  };

  const handleTest = async () => {
    const prompt = (data.prompt || '').trim();
    if (!prompt) {
      alert('Please enter a prompt first');
      return;
    }

    if (mode === 'structured') {
      const schema = buildSchemaObject();
      if (!schema) {
        alert('Please define at least one schema field');
        return;
      }
    }

    setIsTesting(true);
    setTestResult('');

    try {
      const resolvedPrompt = resolveVariables(data.prompt || '', props.id, nodes, edges);
      const resolvedSystem = data.systemPrompt ? resolveVariables(data.systemPrompt, props.id, nodes, edges) : undefined;

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
              systemPrompt: resolvedSystem,
            },
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Request failed');
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
              const evt = JSON.parse(line.slice(6));
              if (evt.error) throw new Error(evt.error);
              if (evt.fullText) setTestResult(evt.fullText);
              if (evt.done) {
                const finalText = evt.text || evt.fullText || '';
                setTestResult(finalText);
                updateNode(props.id, { result: finalText });
              }
            }
          }
        }
      } else {
        const schemaObj = buildSchemaObject();
        const response = await fetch('/api/workflows/test-node', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeType: 'structured-data',
            config: {
              prompt: resolvedPrompt,
              schema: schemaObj,
              schemaName: data.schemaName || 'response',
              schemaDescription: data.schemaDescription || '',
              model: data.model || 'gpt-4o-mini',
              temperature: data.temperature ?? 0.7,
            },
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Request failed');
        }

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Generation failed');
        setTestResult(result.object);
        updateNode(props.id, { result: result.object });
      }
    } catch (e: any) {
      setTestResult(`Error: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testButton = (
    <button
      onClick={handleTest}
      disabled={isTesting}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: 'rgba(39, 39, 42, 0.8)',
        border: '1px solid rgba(161, 161, 170, 0.3)',
        borderRadius: '6px',
        color: 'rgb(228, 228, 231)',
        fontSize: '12px',
        fontWeight: 500,
        fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
        cursor: isTesting ? 'not-allowed' : 'pointer',
        opacity: isTesting ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!isTesting) {
          e.currentTarget.style.background = 'rgba(161, 161, 170, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(161, 161, 170, 0.5)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isTesting) {
          e.currentTarget.style.background = 'rgba(39, 39, 42, 0.8)';
          e.currentTarget.style.borderColor = 'rgba(161, 161, 170, 0.3)';
        }
      }}
    >
      <Play size={14} strokeWidth={2} />
      {isTesting ? 'Testing...' : 'Test'}
    </button>
  );

  return (
    <BaseAINode
      {...props}
      data={data}
      icon={mode === 'text' ? <MessageSquare size={20} /> : <Database size={20} />}
      headerActions={testButton}
    >
      {/* Settings Info - White Text */}
      <div style={{ marginBottom: 8, fontSize: '11px', fontFamily: 'monospace', color: '#e4e4e7' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#71717a' }}>model:</span>
            <span style={{ color: '#e4e4e7' }}>{data.model || 'gpt-4o-mini'}</span>
          </div>
          {data.prompt && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <span style={{ color: '#71717a', flexShrink: 0 }}>prompt:</span>
              <span style={{ color: '#e4e4e7', wordBreak: 'break-word', maxWidth: '100%' }}>
                {data.prompt.length > 50 ? `${data.prompt.substring(0, 50)}...` : data.prompt}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Results - Dark Block */}
      {(data.result || testResult) && (
        <div style={{ marginTop: 8 }}>
          <div style={{ 
            maxHeight: 200, 
            overflowY: 'auto', 
            padding: 8, 
            background: 'rgba(24, 24, 27, 0.9)', 
            borderRadius: 4, 
            border: '1px solid rgba(63, 63, 70, 0.5)',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#e4e4e7'
          }}>
            {mode === 'structured' ? (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(testResult || data.result, null, 2)}</pre>
            ) : (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{String(testResult || data.result)}</pre>
            )}
          </div>
        </div>
      )}
    </BaseAINode>
  );
};

export const GenerateNode = React.memo(GenerateNodeComponent);
GenerateNode.displayName = 'GenerateNode';

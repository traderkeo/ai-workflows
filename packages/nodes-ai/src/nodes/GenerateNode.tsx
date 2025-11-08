import React, { useMemo, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { MessageSquare, Database, Play, Trash2, Info, Settings, Sliders, Code, FileText } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables, getAvailableVariables } from '../utils/variableResolver';
import { ModelSelector } from '../components/ModelSelector';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../components/ui/Select';
import type { GenerationMode } from '../config/modelCapabilities';
import type { GenerateNodeData } from '../types';
import { CollapsibleSection } from '../components/ui/CollapsibleSection';

const GenerateNodeComponent: React.FC<NodeProps> = (props) => {
  const data = props.data as GenerateNodeData;
  const updateNode = useFlowStore((s) => s.updateNode);
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | object>('');
  const [showVariables, setShowVariables] = useState(false);

  const mode = data.mode || 'text';

  const availableVariables = useMemo(
    () => getAvailableVariables(props.id, nodes, edges),
    [props.id, nodes, edges]
  );

  const handleChange = (field: keyof GenerateNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const handleDelete = () => {
    if (confirm('Delete this node?')) deleteNode(props.id);
  };

  const addSchemaField = () => {
    const fields = data.schemaFields || [];
    handleChange('schemaFields', [...fields, { name: '', type: 'string', description: '' }]);
  };

  const removeSchemaField = (index: number) => {
    const fields = (data.schemaFields || []).filter((_, i) => i !== index);
    handleChange('schemaFields', fields);
  };

  const updateSchemaField = (index: number, part: { name?: string; type?: any; description?: string }) => {
    const fields = (data.schemaFields || []).map((f, i) => (i === index ? { ...f, ...part } : f));
    handleChange('schemaFields', fields);
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

  return (
    <BaseAINode
      {...props}
      data={data}
      icon={mode === 'text' ? <MessageSquare size={20} /> : <Database size={20} />}
    >
      <div className="ai-node-field" style={{ display: 'flex', gap: 8 }}>
        <Button variant={mode==='text' ? 'secondary' : 'outline'} size="sm" onClick={() => handleChange('mode','text')} className="flex-1">Text</Button>
        <Button variant={mode==='structured' ? 'secondary' : 'outline'} size="sm" onClick={() => handleChange('mode','structured')} className="flex-1">Structured</Button>
      </div>

      {/* Prompt Section */}
      <CollapsibleSection title="Prompt" icon={<MessageSquare size={14} />} defaultOpen={true}>
        <div className="ai-node-field">
          <label className="ai-node-field-label">Prompt</label>
          <textarea
            className="ai-node-input ai-node-textarea nodrag"
            rows={4}
            value={data.prompt || ''}
            onChange={(e) => handleChange('prompt', e.target.value)}
            placeholder={mode === 'text' ? 'Enter your prompt...' : 'Describe the structured data you need...'}
          />
          {availableVariables.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <button onClick={() => setShowVariables(!showVariables)} style={{ background: 'none', border: 'none', color: '#888', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Info size={12} />
                {showVariables ? 'Hide' : 'Show'} available variables ({availableVariables.length})
              </button>
              {showVariables && (
                <div style={{ marginTop: 4, padding: 6, background: 'rgba(0,0,0,0.2)', borderRadius: 4, fontSize: 10, color: '#888', maxHeight: 100, overflowY: 'auto' }}>
                  {availableVariables.map((v, i) => (
                    <div key={i} style={{ padding: '2px 0', fontFamily: 'monospace' }}>{v}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Model Section */}
      <CollapsibleSection title="Model Settings" icon={<Settings size={14} />} defaultOpen={true}>
        <div className="ai-node-field">
          <label className="ai-node-field-label">Model</label>
          <ModelSelector
            value={data.model || 'gpt-4o-mini'}
            mode={(mode as GenerationMode) || 'text'}
            onChange={(id) => handleChange('model', id)}
            allowCustomId
          />
        </div>
      </CollapsibleSection>

      {/* Parameters Section */}
      <CollapsibleSection title="Parameters" icon={<Sliders size={14} />} defaultOpen={false}>
        <div className="ai-node-field">
          <label className="ai-node-field-label">Temperature</label>
          <Input type="number" value={data.temperature ?? 0.7} onChange={(e) => handleChange('temperature', parseFloat((e.target as HTMLInputElement).value))} min={0} max={2} step={0.1} />
        </div>
        <div className="ai-node-field">
          <label className="ai-node-field-label">Max Tokens</label>
          <Input type="number" value={data.maxTokens ?? 1000} onChange={(e) => handleChange('maxTokens', parseInt((e.target as HTMLInputElement).value))} min={1} max={4000} />
        </div>
        <div className="ai-node-field">
          <label className="ai-node-field-label">System Prompt</label>
          <textarea
            className="ai-node-input ai-node-textarea nodrag"
            rows={2}
            placeholder="Optional system prompt..."
            value={data.systemPrompt || ''}
            onChange={(e) => handleChange('systemPrompt', e.target.value)}
          />
        </div>
      </CollapsibleSection>

      {/* Schema Section - Only for structured mode */}
      {mode === 'structured' && (
        <CollapsibleSection title="Schema Definition" icon={<Code size={14} />} defaultOpen={true}>
          <div className="ai-node-field">
            <label className="ai-node-field-label">Schema Fields</label>
            <div>
              {(data.schemaFields || [{ name: '', type: 'string', description: '' }]).map((f, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 28px', gap: 6, marginBottom: 6 }}>
                  <Input placeholder="Field name" value={f.name}
                    onChange={(e) => updateSchemaField(i, { name: (e.target as HTMLInputElement).value })} />
                  <Select value={f.type} onValueChange={(v) => updateSchemaField(i, { type: v as any })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Types</SelectLabel>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="object">Object</SelectItem>
                        <SelectItem value="array">Array</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => removeSchemaField(i)}>Remove</Button>
                  <Input placeholder="Description (optional)" value={f.description || ''}
                    onChange={(e) => updateSchemaField(i, { description: (e.target as HTMLInputElement).value })} style={{ gridColumn: '1 / span 3', marginTop: 4 }} />
                </div>
              ))}
              <Button onClick={addSchemaField} variant="outline" style={{ marginTop: 6 }}>+ Add Field</Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, marginTop: 8 }}>
              <Input placeholder="Schema Name" value={data.schemaName || ''} onChange={(e) => handleChange('schemaName', (e.target as HTMLInputElement).value)} />
              <Input placeholder="Schema Description" value={data.schemaDescription || ''} onChange={(e) => handleChange('schemaDescription', (e.target as HTMLInputElement).value)} />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Results Section */}
      {(data.result || testResult) && (
        <CollapsibleSection title="Result" icon={<FileText size={14} />} defaultOpen={true}>
          <div className="ai-node-field">
            <div className="ai-node-field-value" style={{ maxHeight: 180, overflowY: 'auto', padding: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 4, border: '1px solid rgba(176,38,255,0.3)' }}>
              {mode === 'structured' ? (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(testResult || data.result, null, 2)}</pre>
              ) : (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{String(testResult || data.result)}</pre>
              )}
            </div>
          </div>
        </CollapsibleSection>
      )}

      <div className="ai-node-field" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Button onClick={handleTest} disabled={isTesting} variant="default" className="flex-1">
          <Play size={14} /> {isTesting ? 'Testing...' : 'Test'}
        </Button>
        <Button onClick={handleDelete} variant="outline">
          <Trash2 size={14} />
        </Button>
      </div>
    </BaseAINode>
  );
};

export const GenerateNode = React.memo(GenerateNodeComponent);
GenerateNode.displayName = 'GenerateNode';

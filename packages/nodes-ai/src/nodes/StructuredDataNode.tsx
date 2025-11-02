import React, { useState, useMemo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Database, Play, Trash2, Plus, X, Info } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables, getAvailableVariables } from '../utils/variableResolver';
import type { StructuredDataNodeData } from '../types';

interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
}

export const StructuredDataNode: React.FC<NodeProps> = (props) => {
  const data = props.data as StructuredDataNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>(
    data.schemaFields || [{ name: '', type: 'string', description: '' }]
  );
  const [showVariables, setShowVariables] = useState(false);

  const availableVariables = useMemo(
    () => getAvailableVariables(props.id, nodes, edges),
    [props.id, nodes, edges]
  );

  const handleChange = (field: keyof StructuredDataNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const handleDelete = () => {
    if (confirm('Delete this node?')) {
      deleteNode(props.id);
    }
  };

  const addSchemaField = () => {
    const newFields = [...schemaFields, { name: '', type: 'string' as const, description: '' }];
    setSchemaFields(newFields);
    updateNode(props.id, { schemaFields: newFields });
  };

  const removeSchemaField = (index: number) => {
    const newFields = schemaFields.filter((_, i) => i !== index);
    setSchemaFields(newFields);
    updateNode(props.id, { schemaFields: newFields });
  };

  const updateSchemaField = (index: number, field: Partial<SchemaField>) => {
    const newFields = schemaFields.map((f, i) => (i === index ? { ...f, ...field } : f));
    setSchemaFields(newFields);
    updateNode(props.id, { schemaFields: newFields });
  };

  const buildZodSchema = () => {
    const fields = schemaFields.filter(f => f.name.trim());
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

    const schema = buildZodSchema();
    if (!schema) {
      alert('Please define at least one schema field');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Resolve all variables in the prompt
      const resolvedPrompt = resolveVariables(data.prompt, props.id, nodes, edges);

      // Call server-side API
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
    } catch (error: any) {
      setTestResult({ error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <BaseAINode {...props} data={data} icon={<Database size={20} />}>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Prompt</label>
        <textarea
          className="ai-node-input ai-node-textarea"
          value={data.prompt || ''}
          onChange={(e) => handleChange('prompt', e.target.value)}
          placeholder="Describe the structured data you need..."
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="ai-node-field-label">Schema Fields</label>
          <button
            onClick={addSchemaField}
            style={{
              padding: '4px 8px',
              background: 'rgba(176, 38, 255, 0.2)',
              border: '1px solid rgba(176, 38, 255, 0.5)',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={12} /> Add Field
          </button>
        </div>
        {schemaFields.map((field, index) => (
          <div
            key={index}
            style={{
              marginBottom: '8px',
              padding: '8px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              border: '1px solid rgba(176, 38, 255, 0.2)'
            }}
          >
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
              <input
                type="text"
                className="ai-node-input"
                value={field.name}
                onChange={(e) => updateSchemaField(index, { name: e.target.value })}
                placeholder="Field name"
                style={{ flex: 1, fontSize: '11px' }}
              />
              <select
                className="ai-node-select"
                value={field.type}
                onChange={(e) => updateSchemaField(index, { type: e.target.value as SchemaField['type'] })}
                style={{ flex: 1, fontSize: '11px' }}
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
              </select>
              {schemaFields.length > 1 && (
                <button
                  onClick={() => removeSchemaField(index)}
                  style={{
                    padding: '4px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <input
              type="text"
              className="ai-node-input"
              value={field.description || ''}
              onChange={(e) => updateSchemaField(index, { description: e.target.value })}
              placeholder="Description (optional)"
              style={{ fontSize: '10px' }}
            />
          </div>
        ))}
      </div>

      <div className="ai-node-field">
        <label className="ai-node-field-label">Schema Name</label>
        <input
          type="text"
          className="ai-node-input"
          value={data.schemaName || ''}
          onChange={(e) => handleChange('schemaName', e.target.value)}
          placeholder="e.g., UserProfile"
        />
      </div>

      <div className="ai-node-field">
        <label className="ai-node-field-label">Schema Description</label>
        <input
          type="text"
          className="ai-node-input"
          value={data.schemaDescription || ''}
          onChange={(e) => handleChange('schemaDescription', e.target.value)}
          placeholder="Brief description of the schema..."
        />
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

      {data.result && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Result</label>
          <div className="ai-node-field-value" style={{
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: '1px solid rgba(176, 38, 255, 0.3)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px'
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(data.result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {data.usage && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Token Usage</label>
          <div className="ai-node-field-value">
            {data.usage.totalTokens} tokens
          </div>
        </div>
      )}

      {testResult && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Test Result</label>
          <div className="ai-node-field-value" style={{
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: isTesting
              ? '1px solid rgba(59, 130, 246, 0.5)'
              : '1px solid rgba(34, 197, 94, 0.3)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px'
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="ai-node-field" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
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
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </BaseAINode>
  );
};

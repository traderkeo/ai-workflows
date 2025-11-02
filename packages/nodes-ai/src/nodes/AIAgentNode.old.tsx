import React, { useState, useMemo, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { Bot, Play, Trash2, Plus, X, Info, Settings, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables, getAvailableVariables } from '../utils/variableResolver';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from '../components/ui/Select';
import type { AIAgentNodeData } from '../types';

// Import model capabilities from ai-workers
// For now, we'll use a simplified approach - all major chat models support both modes
// In the future, this can be enhanced with proper capability detection
const modelSupportsStructuredData = (modelId: string): boolean => {
  // Models that don't support structured data (if any)
  // Currently all our models support structured data generation
  return true;
};

interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
}

export const AIAgentNode: React.FC<NodeProps> = (props) => {
  const data = props.data as AIAgentNodeData;
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const availableVariables = useMemo(
    () => getAvailableVariables(props.id, nodes, edges),
    [props.id, nodes, edges]
  );

  const handleChange = (field: keyof AIAgentNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  // Check if current model supports structured data
  const currentModel = data.model || 'gpt-4o-mini';
  const supportsStructuredData = useMemo(() => {
    return modelSupportsStructuredData(currentModel);
  }, [currentModel]);

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
      // Resolve all variables in the prompt
      const resolvedPrompt = resolveVariables(data.prompt, props.id, nodes, edges);
      const resolvedInstructions = data.instructions
        ? resolveVariables(data.instructions, props.id, nodes, edges)
        : undefined;

      if (mode === 'text') {
        // Text generation mode
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
      } else {
        // Structured data mode
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

  return (
    <BaseAINode {...props} data={data} icon={<Bot size={20} />}>
      {/* Mode Selector */}
      <div className="ai-node-field">
        <label className="ai-node-field-label">Mode</label>
        <Select value={mode} onValueChange={(value) => handleChange('mode', value as 'text' | 'structured')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text Generation</SelectItem>
            <SelectItem value="structured" disabled={!supportsStructuredData}>
              Structured Data {!supportsStructuredData ? '(Not supported)' : ''}
            </SelectItem>
          </SelectContent>
        </Select>
        {!supportsStructuredData && mode === 'text' && (
          <div style={{
            marginTop: '4px',
            padding: '6px 8px',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px'
          }}>
            <AlertCircle size={12} style={{ marginTop: '1px', flexShrink: 0 }} />
            <span>
              The selected model does not support structured data generation.
              Choose a different model to enable structured mode.
            </span>
          </div>
        )}
      </div>

      {/* Prompt */}
      <div className="ai-node-field">
        <label className="ai-node-field-label">Prompt</label>
        <textarea
          className="ai-node-input ai-node-textarea"
          value={data.prompt || ''}
          onChange={(e) => handleChange('prompt', e.target.value)}
          placeholder={
            mode === 'text'
              ? 'Enter your prompt...'
              : 'Describe the structured data you need...'
          }
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

      {/* Structured Mode Schema Fields */}
      {mode === 'structured' && (
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
      )}

      {/* Advanced Settings Toggle */}
      <div className="ai-node-field">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(176, 38, 255, 0.3)',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={14} />
            Advanced Settings
          </div>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Advanced Settings Content */}
      {showAdvanced && (
        <>
          {/* Instructions (System Prompt) */}
          <div className="ai-node-field">
            <label className="ai-node-field-label">Instructions</label>
            <textarea
              className="ai-node-input ai-node-textarea"
              value={data.instructions || ''}
              onChange={(e) => handleChange('instructions', e.target.value)}
              placeholder="Optional system instructions for the AI..."
              rows={3}
            />
          </div>

          {/* Model */}
          <div className="ai-node-field">
            <label className="ai-node-field-label">Model</label>
            <Select value={data.model || 'gpt-4o-mini'} onValueChange={(value) => handleChange('model', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>OpenAI</SelectLabel>
                  <SelectItem value="gpt-4o">GPT-4o (Most Capable)</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                </SelectGroup>

                <SelectGroup>
                  <SelectLabel>Anthropic</SelectLabel>
                  <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Latest)</SelectItem>
                  <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</SelectItem>
                  <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                </SelectGroup>

                <SelectGroup>
                  <SelectLabel>Google</SelectLabel>
                  <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Latest)</SelectItem>
                  <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                  <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                  <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                  <SelectItem value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
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

          {/* Max Tokens (only for text mode) */}
          {mode === 'text' && (
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
          )}

          {/* Schema Name & Description (only for structured mode) */}
          {mode === 'structured' && (
            <>
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
            </>
          )}
        </>
      )}

      {/* Result Display */}
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
            whiteSpace: mode === 'structured' ? 'pre' : 'pre-wrap',
            fontFamily: mode === 'structured' ? 'var(--font-mono)' : 'inherit',
            fontSize: mode === 'structured' ? '11px' : 'inherit'
          }}>
            {mode === 'structured' && typeof data.result === 'object'
              ? JSON.stringify(data.result, null, 2)
              : (data.streamingText || data.result)}
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

      {/* Token Usage */}
      {data.usage && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Token Usage</label>
          <div className="ai-node-field-value">
            {data.usage.totalTokens} tokens (
            {data.usage.promptTokens} prompt + {data.usage.completionTokens} completion)
          </div>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Test Result</label>
          <div className="ai-node-field-value" style={{
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: isTesting
              ? '1px solid rgba(59, 130, 246, 0.5)'
              : '1px solid rgba(34, 197, 94, 0.3)',
            whiteSpace: 'pre-wrap',
            fontFamily: mode === 'structured' ? 'var(--font-mono)' : 'inherit',
            fontSize: mode === 'structured' ? '11px' : 'inherit'
          }}>
            {typeof testResult === 'object'
              ? JSON.stringify(testResult, null, 2)
              : testResult}
          </div>
        </div>
      )}

      {/* Action Buttons */}
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

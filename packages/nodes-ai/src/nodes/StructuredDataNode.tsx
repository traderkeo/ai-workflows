import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Database } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import type { StructuredDataNodeData } from '../types';

export const StructuredDataNode: React.FC<NodeProps> = (props) => {
  const data = props.data as StructuredDataNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);

  const handleChange = (field: keyof StructuredDataNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
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
          <option value="gpt-4o">GPT-4o (Most Capable)</option>
          <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
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
    </BaseAINode>
  );
};

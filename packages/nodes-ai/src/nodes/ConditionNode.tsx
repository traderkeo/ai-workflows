import React from 'react';
import { NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';

export interface ConditionNodeData {
  label: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  conditionType: 'length' | 'contains' | 'custom';
  conditionValue?: string | number;
  conditionCode?: string;
  result?: boolean; // This should match conditionMet to be available as a variable
  conditionMet?: boolean;
  executionTime?: number;
}

export const ConditionNode: React.FC<NodeProps> = (props) => {
  const data = props.data as unknown as ConditionNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);

  const handleChange = (field: keyof ConditionNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  return (
    <BaseAINode {...props} data={data} icon={<GitBranch size={20} />}>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Condition Type</label>
        <select
          className="ai-node-select"
          value={data.conditionType || 'length'}
          onChange={(e) => handleChange('conditionType', e.target.value)}
        >
          <option value="length">Text Length</option>
          <option value="contains">Contains Text</option>
          <option value="custom">Custom JS</option>
        </select>
      </div>

      {data.conditionType === 'length' && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Min Length</label>
          <input
            type="number"
            className="ai-node-input"
            value={data.conditionValue ?? 100}
            onChange={(e) => handleChange('conditionValue', parseInt(e.target.value))}
            min="0"
            placeholder="e.g., 100"
          />
          <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
            Text longer than this → TRUE handle
          </div>
        </div>
      )}

      {data.conditionType === 'contains' && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Search Text</label>
          <input
            type="text"
            className="ai-node-input"
            value={data.conditionValue ?? ''}
            onChange={(e) => handleChange('conditionValue', e.target.value)}
            placeholder="e.g., keyword"
          />
          <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
            Contains text → TRUE handle
          </div>
        </div>
      )}

      {data.conditionType === 'custom' && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Condition Code</label>
          <textarea
            className="ai-node-input ai-node-textarea"
            value={data.conditionCode || 'return input.length > 100;'}
            onChange={(e) => handleChange('conditionCode', e.target.value)}
            placeholder="return input.length > 100;"
            rows={3}
          />
          <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
            Return true/false. Variable: input
          </div>
        </div>
      )}

      {data.conditionMet !== undefined && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Condition Result</label>
          <div style={{
            padding: '8px',
            background: data.conditionMet
              ? 'rgba(57, 255, 20, 0.1)'
              : 'rgba(255, 0, 64, 0.1)',
            borderRadius: '4px',
            border: data.conditionMet
              ? '1px solid rgba(57, 255, 20, 0.3)'
              : '1px solid rgba(255, 0, 64, 0.3)',
            color: data.conditionMet ? '#39ff14' : '#ff0040',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {data.conditionMet ? '✓ TRUE' : '✗ FALSE'}
          </div>
        </div>
      )}
    </BaseAINode>
  );
};

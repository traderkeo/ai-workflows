import React from 'react';
import { NodeProps } from '@xyflow/react';
import { GitMerge } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';

export interface MergeNodeData {
  label: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  mergeStrategy: 'object' | 'array' | 'concat';
  result?: any;
  executionTime?: number;
}

export const MergeNode: React.FC<NodeProps> = (props) => {
  const data = props.data as unknown as MergeNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);

  const handleChange = (field: keyof MergeNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  return (
    <BaseAINode {...props} data={data} icon={<GitMerge size={20} />}>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Merge Strategy</label>
        <select
          className="ai-node-select"
          value={data.mergeStrategy || 'object'}
          onChange={(e) => handleChange('mergeStrategy', e.target.value)}
        >
          <option value="object">Object (Key-Value Pairs)</option>
          <option value="array">Array (List)</option>
          <option value="concat">Concat (Join Text)</option>
        </select>
      </div>

      <div className="ai-node-field">
        <div className="ai-node-field-value" style={{
          padding: '8px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#888'
        }}>
          {data.mergeStrategy === 'object' && '→ Combines inputs as {input1: value1, input2: value2}'}
          {data.mergeStrategy === 'array' && '→ Combines inputs as [value1, value2, value3]'}
          {data.mergeStrategy === 'concat' && '→ Joins inputs as "value1\\n\\nvalue2\\n\\nvalue3"'}
        </div>
      </div>

      {data.result && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Merged Result</label>
          <div className="ai-node-field-value" style={{
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: '1px solid rgba(176, 38, 255, 0.3)',
            fontFamily: 'monospace',
            fontSize: '10px'
          }}>
            {typeof data.result === 'string'
              ? data.result
              : JSON.stringify(data.result, null, 2)}
          </div>
        </div>
      )}
    </BaseAINode>
  );
};

import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';

export interface StartNodeData {
  label: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  value: any;
  valueType: 'string' | 'number' | 'object' | 'array';
}

export const StartNode: React.FC<NodeProps> = (props) => {
  const data = props.data as unknown as StartNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);

  const handleValueChange = (value: string) => {
    let parsedValue: any = value;

    // Try to parse based on valueType
    try {
      if (data.valueType === 'number') {
        parsedValue = parseFloat(value);
      } else if (data.valueType === 'object' || data.valueType === 'array') {
        parsedValue = JSON.parse(value);
      }
    } catch (e) {
      // Keep as string if parsing fails
    }

    updateNode(props.id, { value: parsedValue });
  };

  const handleTypeChange = (type: StartNodeData['valueType']) => {
    updateNode(props.id, { valueType: type });
  };

  const displayValue =
    typeof data.value === 'object'
      ? JSON.stringify(data.value, null, 2)
      : String(data.value || '');

  return (
    <BaseAINode
      {...props}
      data={data}
      icon={<Play size={20} />}
      hasInput={false}
      hasOutput={true}
    >
      <div className="ai-node-field">
        <label className="ai-node-field-label">Initial Data</label>
        <textarea
          className="ai-node-input ai-node-textarea"
          value={displayValue}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="Enter starting data for workflow..."
          rows={4}
        />
      </div>

      <div className="ai-node-field">
        <label className="ai-node-field-label">Data Type</label>
        <select
          className="ai-node-select"
          value={data.valueType}
          onChange={(e) => handleTypeChange(e.target.value as StartNodeData['valueType'])}
        >
          <option value="string">Text</option>
          <option value="number">Number</option>
          <option value="object">JSON Object</option>
          <option value="array">Array</option>
        </select>
      </div>
    </BaseAINode>
  );
};

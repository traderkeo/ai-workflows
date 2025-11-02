import React from 'react';
import { NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';

export interface TemplateNodeData {
  label: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  template: string;
  result?: string;
  executionTime?: number;
}

export const TemplateNode: React.FC<NodeProps> = (props) => {
  const data = props.data as unknown as TemplateNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);

  const handleChange = (field: keyof TemplateNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  return (
    <BaseAINode {...props} data={data} icon={<FileText size={20} />}>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Template</label>
        <textarea
          className="ai-node-input ai-node-textarea"
          value={data.template || ''}
          onChange={(e) => handleChange('template', e.target.value)}
          placeholder="Use {{input}} or {{variable}} for placeholders..."
          rows={6}
        />
        <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
          Available variables:
          <br />• {'{{input}}'} - Previous node&apos;s output
          <br />• {'{{input.property}}'} - Access object properties
        </div>
      </div>

      {data.result && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Generated Text</label>
          <div className="ai-node-field-value" style={{
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: '1px solid rgba(176, 38, 255, 0.3)',
            whiteSpace: 'pre-wrap'
          }}>
            {data.result}
          </div>
        </div>
      )}
    </BaseAINode>
  );
};

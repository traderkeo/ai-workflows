import React, { useState, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { useDebouncedNodeUpdate } from '../hooks/useDebouncedNodeUpdate';

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
  const debouncedUpdate = useDebouncedNodeUpdate(props.id, 300);

  const [localTemplate, setLocalTemplate] = useState(data.template || '');
  useEffect(() => setLocalTemplate(data.template || ''), [data.template]);

  const handleChange = (field: keyof TemplateNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  return (
    <BaseAINode {...props} data={data} icon={<FileText size={20} />}>
      <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
        <label className="ai-node-field-label" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>Template</label>
        <textarea
          className="ai-node-input ai-node-textarea nodrag"
          value={localTemplate}
          onChange={(e) => {
            setLocalTemplate(e.target.value);
            debouncedUpdate({ template: e.target.value });
          }}
          placeholder="Use {{input}} or {{variable}} for placeholders..."
          rows={6}
          style={{
            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}
        />
        <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.01em', color: '#888', marginTop: '4px' }}>
          Available variables:
          <br />• {'{{input}}'} - Previous node&apos;s output
          <br />• {'{{input.property}}'} - Access object properties
        </div>
      </div>

      {data.result && (
        <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
          <label className="ai-node-field-label" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>Generated Text</label>
          <div className="ai-node-field-value" style={{
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: '1px solid rgba(176, 38, 255, 0.3)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}>
            {data.result}
          </div>
        </div>
      )}
    </BaseAINode>
  );
};

import React from 'react';
import { NodeProps } from '@xyflow/react';
import { CheckCircle } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import type { OutputNodeData } from '../types';

export const OutputNode: React.FC<NodeProps> = (props) => {
  const data = props.data as OutputNodeData;

  const displayValue = () => {
    if (!data.value) return 'No output yet';

    if (typeof data.value === 'object') {
      return JSON.stringify(data.value, null, 2);
    }

    return String(data.value);
  };

  return (
    <BaseAINode
      {...props}
      data={data}
      icon={<CheckCircle size={20} />}
      hasInput={true}
      hasOutput={false}
    >
      <div className="ai-node-field">
        <label className="ai-node-field-label">Output Value</label>
        <div
          className="ai-node-field-value"
          style={{
            maxHeight: '250px',
            overflowY: 'auto',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: '1px solid rgba(57, 255, 20, 0.3)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {displayValue()}
        </div>
      </div>
    </BaseAINode>
  );
};

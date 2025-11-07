import React from 'react';
import { NodeProps } from '@xyflow/react';
import { CheckCircle } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import type { StopNodeData } from '../types';

const OutputNodeComponent: React.FC<NodeProps> = (props) => {
  const data = props.data as StopNodeData;

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
      <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
        <label className="ai-node-field-label" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>Output Value</label>
        <div
          className="ai-node-field-value"
          style={{
            maxHeight: '250px',
            overflowY: 'auto',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: '1px solid rgba(57, 255, 20, 0.3)',
            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '0.01em',
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

export const OutputNode = React.memo(OutputNodeComponent);
OutputNode.displayName = 'OutputNode';

import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Code2 } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import type { TransformNodeData } from '../types';

export const TransformNode: React.FC<NodeProps> = (props) => {
  const data = props.data as TransformNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);

  const handleCodeChange = (code: string) => {
    updateNode(props.id, { transformCode: code });
  };

  return (
    <BaseAINode {...props} data={data} icon={<Code2 size={20} />}>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Transform Function</label>
        <textarea
          className="ai-node-input ai-node-textarea"
          value={data.transformCode || ''}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="// Transform input data&#10;// Example:&#10;return input.toUpperCase();"
          rows={8}
          style={{
            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}
        />
        <div style={{
          fontSize: '10px',
          color: 'var(--cyber-neon-purple)',
          marginTop: '4px',
          fontWeight: 400,
          letterSpacing: '0.01em',
        }}>
          Write JavaScript code. Access input via 'input' variable.
        </div>
      </div>

      {data.result !== undefined && (
        <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
          <label className="ai-node-field-label" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>Result</label>
          <div className="ai-node-field-value" style={{
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: '1px solid rgba(176, 38, 255, 0.3)',
            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '0.01em',
            whiteSpace: 'pre-wrap',
          }}>
            {typeof data.result === 'object'
              ? JSON.stringify(data.result, null, 2)
              : String(data.result)}
          </div>
        </div>
      )}
    </BaseAINode>
  );
};

import React from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { RotateCw } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import type { LoopNodeData } from '../types';

const LoopNodeComponent: React.FC<NodeProps> = (props) => {
  const { data } = props;
  const nodeData = data as LoopNodeData;

  return (
    <BaseAINode {...props} data={nodeData} icon={<RotateCw size={16} />}>
      {/* Settings Info - White Text */}
      <div style={{ marginBottom: 8, fontSize: '11px', fontFamily: 'monospace', color: '#e4e4e7' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#71717a' }}>loopType:</span>
            <span style={{ color: '#e4e4e7' }}>{nodeData.loopType || 'count'}</span>
          </div>
          {nodeData.loopType === 'count' && nodeData.count !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#71717a' }}>count:</span>
              <span style={{ color: '#e4e4e7' }}>{nodeData.count}</span>
            </div>
          )}
          {nodeData.loopType === 'condition' && nodeData.conditionCode && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <span style={{ color: '#71717a', flexShrink: 0 }}>conditionCode:</span>
              <span style={{ color: '#e4e4e7', wordBreak: 'break-word', maxWidth: '100%' }}>
                {nodeData.conditionCode.length > 40 ? `${nodeData.conditionCode.substring(0, 40)}...` : nodeData.conditionCode}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Results - Dark Block */}
      {nodeData.results && nodeData.results.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{
            padding: '8px',
            background: 'rgba(24, 24, 27, 0.9)',
            borderRadius: '4px',
            border: '1px solid rgba(63, 63, 70, 0.5)',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#e4e4e7',
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(nodeData.results, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Input Handles - Both sides for logic nodes */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#4a4a5a' }}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Right}
        style={{ background: '#4a4a5a' }}
        isConnectable={true}
      />

      {/* Output Handle - Pass (green, bottom-right) */}
      <Handle
        type="source"
        id="pass"
        position={Position.Bottom}
        style={{
          background: 'rgba(29, 255, 150, 0.82)',
          border: '2px solid #7dffc2',
          left: '66.66%',
          transform: 'translateX(-50%)',
        }}
        isConnectable={true}
      />
    </BaseAINode>
  );
};

export const LoopNode = React.memo(LoopNodeComponent);
LoopNode.displayName = 'LoopNode';

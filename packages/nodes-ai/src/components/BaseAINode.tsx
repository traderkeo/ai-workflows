import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { AINodeData, NodeStatus } from '../types';

interface BaseAINodeProps extends NodeProps {
  data: AINodeData;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  hasInput?: boolean;
  hasOutput?: boolean;
  className?: string;
}

const statusColors: Record<NodeStatus, string> = {
  idle: '#4a4a5a',
  running: '#00f0ff',
  success: '#39ff14',
  error: '#ff0040',
  warning: '#ffff00',
};

const statusLabels: Record<NodeStatus, string> = {
  idle: 'Idle',
  running: 'Running',
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
};

export const BaseAINode: React.FC<BaseAINodeProps> = ({
  data,
  icon,
  children,
  hasInput = true,
  hasOutput = true,
  className = '',
  selected,
}) => {
  const status = data.status || 'idle';
  const statusColor = statusColors[status];

  return (
    <div className={`ai-node ${className}`} data-status={status}>
      {/* Input Handle */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: statusColor }}
          isConnectable={true}
        />
      )}

      {/* Header */}
      <div className="ai-node-header">
        {icon && <div className="ai-node-icon">{icon}</div>}
        <div className="ai-node-title">{data.label}</div>
        <div
          className="ai-node-status-badge"
          style={{
            color: statusColor,
            borderColor: statusColor,
            boxShadow: `0 0 5px ${statusColor}`,
          }}
        >
          {statusLabels[status]}
        </div>
      </div>

      {/* Body */}
      <div className="ai-node-body">
        {data.description && (
          <div className="ai-node-field">
            <span className="ai-node-field-label">Description</span>
            <div className="ai-node-field-value">{data.description}</div>
          </div>
        )}

        {children}

        {data.error && (
          <div className="ai-node-field">
            <span className="ai-node-field-label" style={{ color: '#ff0040' }}>
              Error
            </span>
            <div className="ai-node-field-value" style={{ color: '#ff0040' }}>
              {data.error}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {data.executionTime !== undefined && (
        <div className="ai-node-footer">
          Execution Time: {data.executionTime}ms
        </div>
      )}

      {/* Output Handle */}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: statusColor }}
          isConnectable={true}
        />
      )}
    </div>
  );
};

import React from 'react';
import type { NodeStatus } from '../../types';

const COLORS: Record<NodeStatus, string> = {
  idle: '#4a4a5a',
  running: '#00f0ff',
  success: '#39ff14',
  error: '#ff0040',
  warning: '#ffff00',
};

export const StatusBadge: React.FC<{ status: NodeStatus }> = ({ status }) => {
  const color = COLORS[status];
  return (
    <div
      className="ai-node-status-badge"
      style={{
        color,
        borderColor: color,
        boxShadow: `0 0 5px ${color}`,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 500,
        padding: '3px 8px',
        border: '1px solid',
        borderRadius: 4,
      }}
    >
      {status.toUpperCase()}
    </div>
  );
};


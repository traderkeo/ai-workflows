import React from 'react';

interface WorkflowStatsProps {
  nodeCount: number;
  edgeCount: number;
}

export const WorkflowStats: React.FC<WorkflowStatsProps> = ({ nodeCount, edgeCount }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      paddingLeft: '16px',
      borderLeft: '1px solid rgba(176, 38, 255, 0.25)',
      fontSize: '12px',
      fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
      fontWeight: 500,
      color: 'rgba(136, 136, 136, 0.9)',
      height: '36px',
      letterSpacing: '-0.01em',
    }}>
      <span>{nodeCount} nodes</span>
      <span style={{ opacity: 0.5 }}>•</span>
      <span>{edgeCount} edges</span>
    </div>
  );
};

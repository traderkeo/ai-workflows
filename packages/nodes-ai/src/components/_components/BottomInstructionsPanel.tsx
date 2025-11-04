import React from 'react';
import { Panel } from '@xyflow/react';
import { AlertCircle } from 'lucide-react';

export const BottomInstructionsPanel: React.FC = () => {
  return (
    <Panel position="bottom-center">
      <div
        style={{
          background: 'linear-gradient(135deg, var(--gothic-charcoal) 0%, var(--gothic-slate) 100%)',
          border: 'var(--border-glow) solid var(--cyber-neon-purple)',
          borderRadius: '8px',
          boxShadow: 'var(--node-shadow)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted, #888)',
        }}
      >
        <AlertCircle size={14} style={{ color: 'var(--cyber-neon-cyan)' }} />
        <span>Right-click canvas to add nodes • Connect nodes by dragging from handles • Click workflow name to edit</span>
      </div>
    </Panel>
  );
};

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Loader2, Edit2, Check, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/Collapsible';
import type { AINodeData, NodeStatus } from '../types';
import { useFlowStore } from '../hooks/useFlowStore';

interface BaseAINodeProps extends NodeProps {
  data: AINodeData;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  hasInput?: boolean;
  hasOutput?: boolean;
  className?: string;
  headerActions?: React.ReactNode;
  footerContent?: React.ReactNode;
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

const BaseAINodeComponent: React.FC<BaseAINodeProps> = ({
  data,
  icon,
  children,
  hasInput = true,
  hasOutput = true,
  className = '',
  selected,
  id,
  headerActions,
  footerContent,
}) => {
  const status = (data.status || 'idle') as NodeStatus;
  const statusColor = statusColors[status];
  const { updateNode } = useFlowStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(data.name || '');
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed ?? false);

  const handleSaveName = () => {
    if (editedName.trim()) {
      updateNode(id, { name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(data.name || '');
    setIsEditingName(false);
  };

  const handleCollapseChange = (open: boolean) => {
    setIsCollapsed(!open);
    updateNode(id, { isCollapsed: !open });
  };

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
        <div style={{ flex: 1 }}>
          {/* Custom Name (Now on top) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isEditingName ? (
              <>
                <input
                  type="text"
                  value={editedName}
                  className="nodrag"
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  placeholder="Enter name..."
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '2px 6px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid var(--cyber-neon-cyan)',
                    borderRadius: '3px',
                    color: 'var(--cyber-neon-cyan)',
                    outline: 'none',
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                  }}
                />
                <button
                  onClick={handleSaveName}
                  style={{
                    padding: '2px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#39ff14',
                    display: 'flex',
                  }}
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    padding: '2px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ff0040',
                    display: 'flex',
                  }}
                >
                  <X size={12} />
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: '13px',
                    fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                    color: data.name ? 'var(--cyber-neon-cyan)' : '#888',
                    fontStyle: data.name ? 'normal' : 'italic',
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                  }}
                >
                  {data.name || 'Unnamed'}
                </div>
                <button
                  onClick={() => setIsEditingName(true)}
                  style={{
                    padding: '2px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--cyber-neon-cyan)',
                    display: 'flex',
                    opacity: 0.6,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                >
                  <Edit2 size={10} />
                </button>
              </>
            )}
          </div>
          {/* Node Type (Now below name) */}
          <div
            className="ai-node-title"
            style={{
              fontSize: '11px',
              color: '#888',
              marginTop: '2px',
              fontWeight: 400,
              fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
              letterSpacing: '0.01em',
            }}
          >
            {data.label}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {headerActions}
          </div>
          {!footerContent && (
            <div
              className="ai-node-status-badge"
              style={{
                color: statusColor,
                borderColor: statusColor,
                boxShadow: `0 0 5px ${statusColor}`,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '9px',
                padding: '2px 6px',
              }}
            >
              {status === 'running' && <Loader2 size={10} className="animate-spin" />}
              {statusLabels[status]}
            </div>
          )}
        </div>
      </div>

      {/* Body (Collapsible) */}
      <Collapsible open={!isCollapsed} onOpenChange={handleCollapseChange}>
        <CollapsibleTrigger asChild>
          <button
            style={{
              width: '100%',
              padding: '6px 16px',
              background: 'rgba(176, 38, 255, 0.2)',
              border: '1px solid rgba(176, 38, 255, 0.5)',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderRadius: '0',
              color: 'var(--cyber-neon-purple)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
              fontWeight: 500,
              letterSpacing: '0.01em',
            }}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
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
        </CollapsibleContent>
      </Collapsible>

      {/* Footer */}
      {footerContent ? (
        footerContent
      ) : (
        data.executionTime !== undefined && (
          <div className="ai-node-footer">
            Execution Time: {data.executionTime}ms
          </div>
        )
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

export const BaseAINode = React.memo(BaseAINodeComponent);
BaseAINode.displayName = 'BaseAINode';

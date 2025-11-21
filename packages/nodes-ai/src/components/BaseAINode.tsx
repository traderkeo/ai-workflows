import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Loader2, Edit2, Check, X } from 'lucide-react';
import type { AINodeData, NodeStatus } from '../types';
import { useFlowStore } from '../hooks/useFlowStore';
import {
  Pill,
  PillAvatar,
  PillAvatarGroup,
  PillButton,
  PillDelta,
  PillIcon,
  PillIndicator,
  PillStatus,
} from '../components/ui/pill';
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

// Node category colors based on functional type
type NodeCategory = 'trigger' | 'action' | 'logic' | 'transform' | 'data' | 'control';

const getNodeCategory = (nodeType: string): NodeCategory => {
  // Triggers
  if (['start'].includes(nodeType)) return 'trigger';
  // Actions
  if (['generate', 'ai-agent', 'http-request', 'web-scrape', 'web-search', 'image-generation', 'audio-tts', 'video-generation'].includes(nodeType)) return 'action';
  // Logic
  if (['condition', 'merge', 'loop', 'splitter', 'aggregator'].includes(nodeType)) return 'logic';
  // Transform
  if (['transform', 'template', 'rerank'].includes(nodeType)) return 'transform';
  // Data
  if (['file-upload', 'document-ingest', 'retrieval-qa', 'cache', 'guardrail'].includes(nodeType)) return 'data';
  // Control
  if (['stop'].includes(nodeType)) return 'control';
  // Default to action
  return 'action';
};

const categoryColors: Record<NodeCategory, { bg: string; border: string; badge: string }> = {
  trigger: {
    bg: 'rgb(20 83 45)', // green-900
    border: 'rgb(34 197 94)', // green-500
    badge: 'rgb(22 163 74)', // green-700
  },
  action: {
    bg: 'rgb(30 58 138)', // blue-900
    border: 'rgb(59 130 246)', // blue-500
    badge: 'rgb(37 99 235)', // blue-700
  },
  logic: {
    bg: 'rgb(88 28 135)', // purple-900
    border: 'rgb(168 85 247)', // purple-500
    badge: 'rgb(147 51 234)', // purple-700
  },
  transform: {
    bg: 'rgb(154 52 18)', // orange-900
    border: 'rgb(249 115 22)', // orange-500
    badge: 'rgb(234 88 12)', // orange-700
  },
  data: {
    bg: 'rgb(69 26 3)', // amber-900
    border: 'rgb(245 158 11)', // amber-500
    badge: 'rgb(217 119 6)', // amber-700
  },
  control: {
    bg: 'rgb(69 10 10)', // red-900
    border: 'rgb(239 68 68)', // red-500
    badge: 'rgb(220 38 38)', // red-700
  },
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
  type,
  headerActions,
  footerContent,
}) => {
  const status = (data.status || 'idle') as NodeStatus;
  const statusColor = statusColors[status];
  const { updateNode } = useFlowStore();
  
  // Get node category and colors based on node type
  const nodeType = type || '';
  const category = getNodeCategory(nodeType);
  const categoryColor = categoryColors[category];

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(data.name || '');

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


  return (
    <div 
      className={`ai-node ${className} p-1 rounded-lg shadow-md overflow-hidden`} 
      data-status={status}
      style={{
        backgroundColor: categoryColor.bg,
        border: `2px solid ${categoryColor.border}`,
      }}
    >
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
      <div 
        className="flex items-center gap-2 p-2 rounded-md"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        {icon && (
          <div 
            className="size-[30px] text-white rounded-md shadow-md items-center justify-center flex"
            style={{
              backgroundColor: categoryColor.badge,
              border: `1px solid ${categoryColor.border}`,
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ flex: 1 }}>
          {/* Custom Name (Now on top) */}
          <div className="" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                  className="text-sm font-medium text-gray-100 uppercase"
                >
                  {data.name || 'Unnamed'} {}
                </div>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-zinc-800 hover:text-gray-700  p-1 rounded-full size-6"
          
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                >
                  <Edit2 className='size-4'  />
                </button>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          {headerActions ? headerActions : (!footerContent && (
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
          ))}
        </div>
      </div>

      {/* Body - Just show play button and results */}
      <div 
        className="ai-node-body" 
        style={{ 
          padding: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Category Badge - Left Aligned with underline */}
        <div className='gap-3' style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(161, 161, 170, 0.3)' }}>
          <div
            style={{
              backgroundColor: categoryColor.badge,
              color: 'white',
              padding: '6px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {category.toUpperCase()}
          </div>
          <div
            style={{
              backgroundColor: categoryColor.badge,
              color: 'white',
              padding: '6px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              opacity: 0.5,
            }}
          >
            {data.label?.toUpperCase()}
          </div>
        </div>
        
        {children}
        
        {data.error && (
          <div className="ai-node-field" style={{ marginTop: 8 }}>
            <span className="ai-node-field-label" style={{ color: '#ff0040', fontSize: '11px' }}>
              Error
            </span>
            <div className="ai-node-field-value" style={{ color: '#ff0040', fontSize: '11px', marginTop: 4 }}>
              {data.error}
            </div>
          </div>
        )}
      </div>

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

      {/* Output Handle - Default right-side handle */}
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

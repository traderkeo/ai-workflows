import React, { useState, useEffect, useRef } from 'react';
import { Panel } from '@xyflow/react';
import { Play, Save, Upload, Settings, FolderOpen, Download, Grid3x3, Trash2 } from 'lucide-react';
import { SavedWorkflowsPanel } from '../SavedWorkflowsPanel';
import type { SavedWorkflowsPanelHandle } from '../SavedWorkflowsPanel';
import { WorkflowNameEditor } from './WorkflowNameEditor';
import { WorkflowStats } from './WorkflowStats';
import type { SavedWorkflow } from '../../types';

interface WorkflowToolbarProps {
  // Workflow metadata
  workflowName: string;
  workflowId: string;
  tags: string[];

  // Stats
  nodeCount: number;
  edgeCount: number;

  // Execution state
  isExecuting: boolean;

  // Callbacks
  onExecute: () => void;
  onUpdateName: (name: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onExport: () => void;
  onImport: () => void;
  onAutoLayout: () => void;
  onReset: () => void;
  onSaveWorkflow: () => SavedWorkflow;
  onLoadWorkflow: (workflow: SavedWorkflow) => void;
  
  // For autosave tracking
  nodes?: any[];
  edges?: any[];
  savedWorkflowsRef?: React.RefObject<SavedWorkflowsPanelHandle>;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  workflowName,
  workflowId,
  tags,
  nodeCount,
  edgeCount,
  isExecuting,
  onExecute,
  onUpdateName,
  onAddTag,
  onRemoveTag,
  onExport,
  onImport,
  onAutoLayout,
  onReset,
  onSaveWorkflow,
  onLoadWorkflow,
  nodes,
  edges,
  savedWorkflowsRef,
}) => {
  const [showLoadPanel, setShowLoadPanel] = useState(false);
  const [showSavedWorkflows, setShowSavedWorkflows] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const savedWorkflowsPanelRef = useRef<HTMLDivElement>(null);
  const savedWorkflowsButtonRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setShowMoreMenu(false);
      }
      if (showSavedWorkflows && 
          savedWorkflowsPanelRef.current && 
          !savedWorkflowsPanelRef.current.contains(target) &&
          savedWorkflowsButtonRef.current &&
          !savedWorkflowsButtonRef.current.contains(target)) {
        setShowSavedWorkflows(false);
      }
    };
    if (showMoreMenu || showSavedWorkflows) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu, showSavedWorkflows]);
  return (
    <Panel position="top-center" className="w-full">
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          padding: '12px',
        }}
      >
        {/* Single Unified Toolbar */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0px', 
            background: 'rgba(39, 39, 42, 0.95)',
            border: '1px solid rgba(161, 161, 170, 0.3)',
            borderRadius: '8px',
            padding: '4px',
            position: 'relative',
          }}
          className="toolbar-actions"
        >
          {/* Workflow Name */}
          <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '32px' }}>
            <WorkflowNameEditor name={workflowName} onSave={onUpdateName} />
          </div>

          {/* Stats */}
          <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
              fontWeight: 500,
              color: 'rgb(161, 161, 170)',
            }}>
              <span>{nodeCount} nodes</span>
              <span style={{ opacity: 0.5 }}>-</span>
              <span>{edgeCount} edges</span>
            </div>
          </div>

          {/* Vertical Separator */}
          <div style={{
            width: '1px',
            height: '24px',
            background: 'rgba(161, 161, 170, 0.3)',
            margin: '0 4px',
          }} />
            {/* Execute Button - Green */}
            <button
              onClick={onExecute}
              disabled={isExecuting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#22c55e',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: isExecuting ? 'not-allowed' : 'pointer',
                opacity: isExecuting ? 0.7 : 1,
                transition: 'opacity 0.2s',
                fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                whiteSpace: 'nowrap',
              }}
              title="Execute workflow (Ctrl/Cmd + Enter)"
            >
              <Play size={16} strokeWidth={2.5} fill="white" />
              {isExecuting ? 'Running...' : 'Execute'}
            </button>

            {/* Vertical Separator */}
            <div style={{
              width: '1px',
              height: '24px',
              background: 'rgba(161, 161, 170, 0.3)',
              margin: '0 4px',
            }} />

            {/* Save Button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={async () => {
                  // Open the SavedWorkflowsPanel's save dialog
                  const workflow = onSaveWorkflow();
                  if (savedWorkflowsRef?.current) {
                    await savedWorkflowsRef.current.saveCurrentWorkflow(workflow.metadata.name);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'rgb(161, 161, 170)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgb(161, 161, 170)';
                }}
                title="Save workflow"
              >
                <Save size={16} strokeWidth={2} color="currentColor" />
                Save
              </button>
            </div>

            {/* Load Button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setShowLoadPanel(!showLoadPanel);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'rgb(161, 161, 170)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgb(161, 161, 170)';
                }}
                title="Load workflow"
              >
                <Upload size={16} strokeWidth={2} color="currentColor" />
                Load
              </button>
              {showLoadPanel && (
                <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, marginTop: '4px' }}>
                  <SavedWorkflowsPanel
                    ref={savedWorkflowsRef}
                    onSave={onSaveWorkflow}
                    onLoad={(workflow) => {
                      onLoadWorkflow(workflow);
                      setShowLoadPanel(false);
                    }}
                    currentWorkflowId={workflowId}
                    nodes={nodes}
                    edges={edges}
                  />
                </div>
              )}
            </div>

            {/* Vertical Separator */}
            <div style={{
              width: '1px',
              height: '24px',
              background: 'rgba(161, 161, 170, 0.3)',
              margin: '0 4px',
            }} />

            {/* Saved Workflows Button */}
            <div style={{ position: 'relative' }} ref={savedWorkflowsButtonRef}>
              <button
                onClick={() => {
                  setShowSavedWorkflows(!showSavedWorkflows);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'rgb(161, 161, 170)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgb(161, 161, 170)';
                }}
                title="Saved workflows"
              >
                <FolderOpen size={16} strokeWidth={2} color="currentColor" />
                Saved
              </button>
            </div>

            {/* Vertical Separator */}
            <div style={{
              width: '1px',
              height: '24px',
              background: 'rgba(161, 161, 170, 0.3)',
              margin: '0 4px',
            }} />

            {/* More Button */}
            <div style={{ position: 'relative' }} ref={moreMenuRef}>
              <button
                onClick={() => {
                  setShowMoreMenu(!showMoreMenu);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'rgb(161, 161, 170)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgb(161, 161, 170)';
                }}
                title="More options"
              >
                <Settings size={16} strokeWidth={2} color="currentColor" />
                More
              </button>
              {showMoreMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '4px',
                    zIndex: 50,
                    background: 'rgba(39, 39, 42, 0.98)',
                    border: '1px solid rgba(161, 161, 170, 0.3)',
                    borderRadius: '8px',
                    minWidth: '180px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <MenuButton
                    icon={<Download size={14} />}
                    label="Export JSON"
                    onClick={() => {
                      onExport();
                      setShowMoreMenu(false);
                    }}
                  />
                  <MenuButton
                    icon={<Upload size={14} />}
                    label="Import JSON"
                    onClick={() => {
                      onImport();
                      setShowMoreMenu(false);
                    }}
                    withBorder
                  />
                  <MenuButton
                    icon={<Grid3x3 size={14} />}
                    label="Auto Arrange"
                    onClick={() => {
                      onAutoLayout();
                      setShowMoreMenu(false);
                    }}
                    withBorder
                  />
                  <MenuButton
                    icon={<Trash2 size={14} />}
                    label="Reset Workflow"
                    onClick={() => {
                      onReset();
                      setShowMoreMenu(false);
                    }}
                    withBorder
                    danger
                  />
                </div>
              )}
            </div>

            {/* Vertical Separator */}
            <div style={{
              width: '1px',
              height: '24px',
              background: 'rgba(161, 161, 170, 0.3)',
              margin: '0 4px',
            }} />

            {/* Ready Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 12px',
                color: 'rgb(161, 161, 170)',
                fontSize: '14px',
                fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                whiteSpace: 'nowrap',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  flexShrink: 0,
                }}
              />
              <span>Ready</span>
            </div>
            
            {/* Saved Workflows Panel - Positioned relative to toolbar container */}
            {showSavedWorkflows && (
              <div ref={savedWorkflowsPanelRef} style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, marginTop: '4px' }}>
                <SavedWorkflowsPanel
                  ref={savedWorkflowsRef}
                  onSave={onSaveWorkflow}
                  onLoad={(workflow) => {
                    onLoadWorkflow(workflow);
                    setShowSavedWorkflows(false);
                  }}
                  currentWorkflowId={workflowId}
                  nodes={nodes}
                  edges={edges}
                  hideToggleButton={true}
                  isOpen={showSavedWorkflows}
                  onOpenChange={(open) => setShowSavedWorkflows(open)}
                />
              </div>
            )}
          </div>
        </div>
    </Panel>
  );
};

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  withBorder?: boolean;
  danger?: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, label, onClick, withBorder, danger }) => {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        fontSize: '13px',
        background: 'transparent',
        border: 'none',
        borderTop: withBorder ? '1px solid rgba(161, 161, 170, 0.2)' : 'none',
        color: danger ? '#ef4444' : 'rgb(161, 161, 170)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? 'rgba(239, 68, 68, 0.1)'
          : 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.color = danger ? '#ef4444' : 'white';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = danger ? '#ef4444' : 'rgb(161, 161, 170)';
      }}
    >
      {icon}
      {label}
    </button>
  );
};

import React, { useCallback } from 'react';
import { Panel } from '@xyflow/react';
import { Play } from 'lucide-react';
import { Button } from '../ui/Button';
import { SavedWorkflowsPanel } from '../SavedWorkflowsPanel';
import type { SavedWorkflowsPanelHandle } from '../SavedWorkflowsPanel';
import { ThemeSettings } from '../ThemeSettings';
import { WorkflowNameEditor } from './WorkflowNameEditor';
import { TagsManager } from './TagsManager';
import { WorkflowStats } from './WorkflowStats';
import { FileActionsMenu } from './FileActionsMenu';
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
  return (
    <Panel position="top-center" className="w-full">
      <div
        style={{
          background: 'linear-gradient(135deg, var(--gothic-charcoal) 0%, var(--gothic-slate) 100%)',
          border: 'var(--border-glow) solid var(--cyber-neon-purple)',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderRadius: '0 0 12px 12px',
          boxShadow: 'var(--node-shadow)',
          padding: '16px 24px',
          fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}>
          {/* Left: Workflow Info & Tags */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            flex: 1, 
            minWidth: 0,
          }}>
            {/* Workflow Name */}
            <WorkflowNameEditor name={workflowName} onSave={onUpdateName} />

            {/* Tags */}
            <TagsManager
              tags={tags}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
            />

            {/* Stats */}
            <WorkflowStats nodeCount={nodeCount} edgeCount={edgeCount} />
          </div>

          {/* Right: Actions */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              flexShrink: 0,
            }}
            className="toolbar-actions"
          >
            {/* Execute Button */}
            <Button
              onClick={onExecute}
              disabled={isExecuting}
              variant="success"
              size="sm"
              className="h-9 px-4 font-medium"
              title="Execute workflow (Ctrl/Cmd + Enter)"
            >
              <Play size={16} strokeWidth={2} />
              {isExecuting ? 'Running...' : 'Execute'}
            </Button>

            {/* Saved Workflows */}
            <SavedWorkflowsPanel
              ref={savedWorkflowsRef}
              onSave={onSaveWorkflow}
              onLoad={onLoadWorkflow}
              currentWorkflowId={workflowId}
              nodes={nodes}
              edges={edges}
            />

            {/* File Actions Dropdown */}
            <FileActionsMenu
              onExport={onExport}
              onImport={onImport}
              onAutoLayout={onAutoLayout}
              onReset={onReset}
            />

            {/* Theme Settings */}
            <ThemeSettings />
          </div>
        </div>
      </div>
    </Panel>
  );
};

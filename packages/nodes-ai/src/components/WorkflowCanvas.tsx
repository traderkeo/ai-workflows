import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../styles/index.css';

import { useFlowStore } from '../hooks/useFlowStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { StartNode } from '../nodes/StartNode';
import { StopNode } from '../nodes/StopNode';
import { AIAgentNode } from '../nodes/AIAgentNode';
import { TextGenerationNode } from '../nodes/TextGenerationNode';
import { StructuredDataNode } from '../nodes/StructuredDataNode';
import { TransformNode } from '../nodes/TransformNode';
import { MergeNode } from '../nodes/MergeNode';
import { ConditionNode } from '../nodes/ConditionNode';
import { TemplateNode } from '../nodes/TemplateNode';
import { HttpRequestNode } from '../nodes/HttpRequestNode';
import { LoopNode } from '../nodes/LoopNode';
import { SavedWorkflowsPanel } from './SavedWorkflowsPanel';
import { VariablesPanel } from './VariablesPanel';
import { ThemeSettings } from './ThemeSettings';
import { executeWorkflow, validateWorkflow } from '../utils/executionEngine';
import { Play, Upload, Download, Trash2, AlertCircle, MoreVertical, FileJson, FolderOpen, Grid3x3 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import type { AINode } from '../types';

const nodeTypes = {
  start: StartNode,
  stop: StopNode,
  'ai-agent': AIAgentNode,
  'text-generation': TextGenerationNode,
  'structured-data': StructuredDataNode,
  transform: TransformNode,
  merge: MergeNode,
  condition: ConditionNode,
  template: TemplateNode,
  'http-request': HttpRequestNode,
  loop: LoopNode,
};

export const WorkflowCanvas: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    updateNode,
    resetWorkflow,
    exportWorkflow,
    importWorkflow,
    saveWorkflow,
    loadWorkflow,
    isExecuting,
    startExecution,
    stopExecution,
    metadata,
    updateMetadata,
    autoLayoutNodes,
  } = useFlowStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fitView } = useReactFlow();
  const notifications = useNotifications();

  const handleExecute = useCallback(async () => {
    // Validate workflow
    const validation = validateWorkflow(nodes, edges);
    if (!validation.valid) {
      await notifications.showAlert(
        `Workflow validation failed:\n\n${validation.errors.join('\n')}`,
        'Validation Error'
      );
      return;
    }

    startExecution();

    try {
      await executeWorkflow(nodes, edges, (nodeId, updates) => {
        updateNode(nodeId, updates);
      });

      notifications.showToast('Workflow executed successfully!', 'success');
    } catch (error: any) {
      notifications.showToast(`Workflow execution failed: ${error.message}`, 'destructive');
    } finally {
      stopExecution();
    }
  }, [nodes, edges, updateNode, startExecution, stopExecution, notifications]);

  const handleSave = useCallback(() => {
    const json = exportWorkflow();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportWorkflow, metadata.name]);

  const handleLoad = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = e.target?.result as string;
          importWorkflow(json);
          setTimeout(() => fitView(), 100);
          notifications.showToast('Workflow loaded successfully!', 'success');
        } catch (error) {
          notifications.showToast('Failed to load workflow. Invalid file format.', 'destructive');
        }
      };
      reader.readAsText(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [importWorkflow, fitView, notifications]
  );

  const handleReset = useCallback(async () => {
    const confirmed = await notifications.showConfirm(
      'Are you sure you want to reset the workflow? This cannot be undone.',
      'Reset Workflow'
    );
    if (confirmed) {
      resetWorkflow();
    }
  }, [resetWorkflow, notifications]);

  const handleNameChange = useCallback(async () => {
    const newName = await notifications.showPrompt('Enter workflow name:', metadata.name);
    if (newName && newName.trim()) {
      updateMetadata({ name: newName.trim() });
    }
  }, [metadata.name, updateMetadata, notifications]);

  const handleAutoLayout = useCallback(() => {
    autoLayoutNodes();
    setTimeout(() => fitView({ duration: 300 }), 50);
    notifications.showToast('Nodes auto-arranged', 'success');
  }, [autoLayoutNodes, fitView, notifications]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onExecute: handleExecute,
    onSave: handleSave,
  });

  // Track selected node
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | undefined>();
  const [fileMenuOpen, setFileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const selected = nodes.find(n => n.selected);
    setSelectedNodeId(selected?.id);
  }, [nodes]);

  // Close file menu when clicking outside
  React.useEffect(() => {
    if (!fileMenuOpen) return;
    const handleClick = () => setFileMenuOpen(false);
    setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => document.removeEventListener('click', handleClick);
  }, [fileMenuOpen]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
      {/* Variables Panel - Left Sidebar */}
      <VariablesPanel nodes={nodes} selectedNodeId={selectedNodeId} />

      {/* Main Canvas */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          nodesDraggable={true}
          selectNodesOnDrag={false}
          snapToGrid={false}
          defaultEdgeOptions={{
            animated: true,
            style: { strokeWidth: 2 },
          }}
        >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          pannable
          zoomable
          style={{
            backgroundColor: 'var(--gothic-charcoal)',
          }}
        />

        {/* Compact Toolbar */}
        <Panel position="top-center" className="w-full">
          <div className="bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 gap-4 max-w-full">
              {/* Left: Workflow Info */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div
                  onClick={handleNameChange}
                  className="text-base font-semibold text-foreground cursor-pointer hover:text-primary transition-colors truncate"
                  title="Click to rename"
                >
                  {metadata.name}
                </div>
                <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span>{nodes.length} nodes</span>
                  <span className="text-border">•</span>
                  <span>{edges.length} edges</span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Execute Button */}
                <button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 px-3 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  title="Execute workflow"
                >
                  <Play size={14} />
                  <span className="hidden sm:inline">{isExecuting ? 'Running...' : 'Execute'}</span>
                </button>

                {/* Saved Workflows */}
                <SavedWorkflowsPanel
                  onSave={saveWorkflow}
                  onLoad={(workflow) => {
                    loadWorkflow(workflow);
                    setTimeout(() => fitView(), 100);
                  }}
                  currentWorkflowId={metadata.id}
                />

                {/* File Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileMenuOpen(!fileMenuOpen);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-8 px-3 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
                    title="File actions"
                  >
                    <FileJson size={14} />
                    <span className="hidden sm:inline">File</span>
                    <span className="sm:hidden"><MoreVertical size={14} /></span>
                  </button>
                  {fileMenuOpen && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg min-w-[180px] overflow-hidden animate-in fade-in-0 zoom-in-95"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave();
                          setFileMenuOpen(false);
                        }}
                        className="w-full inline-flex items-center justify-start gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        <Download size={14} />
                        Export JSON
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoad();
                          setFileMenuOpen(false);
                        }}
                        className="w-full inline-flex items-center justify-start gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors border-t border-border"
                      >
                        <Upload size={14} />
                        Import JSON
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAutoLayout();
                          setFileMenuOpen(false);
                        }}
                        className="w-full inline-flex items-center justify-start gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors border-t border-border"
                      >
                        <Grid3x3 size={14} />
                        Auto Arrange
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileMenuOpen(false);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleReset();
                        }}
                        className="w-full inline-flex items-center justify-start gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
                      >
                        <Trash2 size={14} />
                        Reset Workflow
                      </button>
                    </div>
                  )}
                </div>

                {/* Theme Settings - Compact */}
                <ThemeSettings />
              </div>
            </div>
          </div>
        </Panel>

        {/* Bottom Panel - Instructions */}
        <Panel position="bottom-center">
          <div className="bg-card border border-border rounded-lg shadow-sm px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <AlertCircle size={14} />
            Right-click canvas to add nodes • Connect nodes by dragging from handles • Click workflow name to edit
          </div>
        </Panel>
        </ReactFlow>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

import React, { useCallback, useRef, useState } from 'react';
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
import { FileUploadNode } from '../nodes/FileUploadNode';
import { SavedWorkflowsPanel } from './SavedWorkflowsPanel';
import { VariablesPanel } from './VariablesPanel';
import { ThemeSettings } from './ThemeSettings';
import { executeWorkflow, validateWorkflow } from '../utils/executionEngine';
import { Play, Upload, Download, Trash2, AlertCircle, MoreVertical, FileJson, FolderOpen, Grid3x3, Plus, X, Edit2, Tag, Check } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import type { AINode } from '../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

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
  'file-upload': FileUploadNode,
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

  // Tag management
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(metadata.name);

  // Update editing name when metadata changes
  React.useEffect(() => {
    if (!isEditingName) {
      setEditingName(metadata.name);
    }
  }, [metadata.name, isEditingName]);

  const handleAddTag = useCallback(() => {
    const tag = newTagValue.trim();
    if (tag && !metadata.tags?.includes(tag)) {
      updateMetadata({ 
        tags: [...(metadata.tags || []), tag],
        updatedAt: Date.now()
      });
      setNewTagValue('');
      setIsAddingTag(false);
    }
  }, [newTagValue, metadata.tags, updateMetadata]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    updateMetadata({ 
      tags: metadata.tags?.filter(t => t !== tagToRemove) || [],
      updatedAt: Date.now()
    });
  }, [metadata.tags, updateMetadata]);

  const handleSaveName = useCallback(() => {
    if (editingName.trim()) {
      updateMetadata({ name: editingName.trim(), updatedAt: Date.now() });
    }
    setIsEditingName(false);
  }, [editingName, updateMetadata]);

  const handleCancelEditName = useCallback(() => {
    setEditingName(metadata.name);
    setIsEditingName(false);
  }, [metadata.name]);

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

        {/* Redesigned Toolbar - Matching Node Design Principles */}
        <Panel position="top-center" className="w-full">
          <div
            style={{
              background: 'linear-gradient(135deg, var(--gothic-charcoal) 0%, var(--gothic-slate) 100%)',
              border: 'var(--border-glow) solid var(--cyber-neon-purple)',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderRadius: '0 0 8px 8px',
              boxShadow: 'var(--node-shadow)',
              padding: '12px 20px',
              fontFamily: 'var(--font-primary)',
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              {/* Left: Workflow Info & Tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                {/* Workflow Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  {isEditingName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName();
                          if (e.key === 'Escape') handleCancelEditName();
                        }}
                        style={{
                          width: '200px',
                          padding: '6px 10px',
                          fontSize: '14px',
                          fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: '1px solid var(--cyber-neon-cyan)',
                          borderRadius: '4px',
                          color: 'var(--cyber-neon-cyan)',
                          outline: 'none',
                          fontWeight: 600,
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSaveName}
                        style={{ padding: '4px', minWidth: 'auto', color: 'var(--status-success)' }}
                        title="Save"
                      >
                        <Check size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEditName}
                        style={{ padding: '4px', minWidth: 'auto', color: '#ff0040' }}
                        title="Cancel"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsEditingName(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                      title="Click to edit name"
                    >
                      <span style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: 'var(--cyber-neon-cyan)',
                        fontFamily: 'var(--font-primary)',
                        letterSpacing: '0.01em',
                        textShadow: '0 0 5px currentColor',
                      }}>
                        {metadata.name}
                      </span>
                      <Edit2 size={12} style={{ color: 'var(--cyber-neon-cyan)', opacity: 0.6 }} />
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {metadata.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        background: 'rgba(176, 38, 255, 0.2)',
                        color: 'var(--cyber-neon-purple)',
                        border: '1px solid rgba(176, 38, 255, 0.4)',
                        borderRadius: '4px',
                      }}
                    >
                      <Tag size={10} />
                      {tag}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(tag);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                          padding: '0',
                          marginLeft: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          opacity: 0.7,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.7';
                        }}
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  ))}
                  
                  {isAddingTag ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Input
                        value={newTagValue}
                        onChange={(e) => setNewTagValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddTag();
                          } else if (e.key === 'Escape') {
                            setIsAddingTag(false);
                            setNewTagValue('');
                          }
                        }}
                        placeholder="Tag name..."
                        style={{
                          width: '120px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: '1px solid var(--cyber-neon-purple)',
                          borderRadius: '4px',
                          color: 'var(--cyber-neon-cyan)',
                          outline: 'none',
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsAddingTag(false);
                          setNewTagValue('');
                        }}
                        style={{ padding: '4px', minWidth: 'auto' }}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingTag(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        background: 'rgba(176, 38, 255, 0.1)',
                        border: '1px dashed rgba(176, 38, 255, 0.4)',
                        borderRadius: '4px',
                        color: 'var(--cyber-neon-purple)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(176, 38, 255, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(176, 38, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.4)';
                      }}
                    >
                      <Plus size={12} />
                      Add Tag
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingLeft: '12px',
                  borderLeft: '1px solid rgba(176, 38, 255, 0.3)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted, #888)',
                }}>
                  <span>{nodes.length} nodes</span>
                  <span>•</span>
                  <span>{edges.length} edges</span>
                </div>
              </div>

              {/* Right: Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {/* Execute Button */}
                <Button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  variant="success"
                  size="sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-primary)',
                  }}
                  title="Execute workflow"
                >
                  <Play size={14} />
                  {isExecuting ? 'Running...' : 'Execute'}
                </Button>

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
                <div style={{ position: 'relative' }}>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileMenuOpen(!fileMenuOpen);
                    }}
                    variant="outline"
                    size="sm"
                    style={{
                      fontFamily: 'var(--font-primary)',
                    }}
                    title="File actions"
                  >
                    <FileJson size={14} />
                    <span>File</span>
                  </Button>
                  {fileMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: '4px',
                        zIndex: 50,
                        background: 'linear-gradient(135deg, var(--gothic-charcoal) 0%, var(--gothic-slate) 100%)',
                        border: 'var(--border-glow) solid var(--cyber-neon-purple)',
                        borderRadius: '8px',
                        boxShadow: 'var(--node-shadow)',
                        minWidth: '180px',
                        overflow: 'hidden',
                        fontFamily: 'var(--font-primary)',
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave();
                          setFileMenuOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          fontSize: '13px',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--cyber-neon-cyan)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
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
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          fontSize: '13px',
                          background: 'transparent',
                          border: 'none',
                          borderTop: '1px solid rgba(176, 38, 255, 0.3)',
                          color: 'var(--cyber-neon-cyan)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
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
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          fontSize: '13px',
                          background: 'transparent',
                          border: 'none',
                          borderTop: '1px solid rgba(176, 38, 255, 0.3)',
                          color: 'var(--cyber-neon-cyan)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
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
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          fontSize: '13px',
                          background: 'transparent',
                          border: 'none',
                          borderTop: '1px solid rgba(176, 38, 255, 0.3)',
                          color: '#ff0040',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 0, 64, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Trash2 size={14} />
                        Reset Workflow
                      </button>
                    </div>
                  )}
                </div>

                {/* Theme Settings */}
                <ThemeSettings />
              </div>
            </div>
          </div>
        </Panel>

        {/* Bottom Panel - Instructions */}
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

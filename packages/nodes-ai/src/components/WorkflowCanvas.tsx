import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
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
import { SplitterNode } from '../nodes/SplitterNode';
import { AggregatorNode } from '../nodes/AggregatorNode';
import { CacheNode } from '../nodes/CacheNode';
import { GuardrailNode } from '../nodes/GuardrailNode';
import { WebScrapeNode } from '../nodes/WebScrapeNode';
import { DocumentIngestNode } from '../nodes/DocumentIngestNode';
import { RetrievalQANode } from '../nodes/RetrievalQANode';
import { WebSearchNode } from '../nodes/WebSearchNode';
import { VariablesPanel } from './VariablesPanel';
import { executeWorkflow, validateWorkflow } from '../utils/executionEngine';
import { useNotifications } from '../context/NotificationContext';
import {
  WorkflowToolbar,
  BottomInstructionsPanel,
} from './_components';

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
  'splitter': SplitterNode,
  'aggregator': AggregatorNode,
  'cache': CacheNode,
  'guardrail': GuardrailNode,
  'web-scrape': WebScrapeNode,
  'document-ingest': DocumentIngestNode,
  'retrieval-qa': RetrievalQANode,
  'web-search': WebSearchNode,
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
    setViewport,
  } = useFlowStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fitView, setViewport: setReactFlowViewport } = useReactFlow();
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

  const handleUpdateName = useCallback((name: string) => {
    updateMetadata({ name, updatedAt: Date.now() });
  }, [updateMetadata]);

  const handleAddTag = useCallback((tag: string) => {
    updateMetadata({ 
      tags: [...(metadata.tags || []), tag],
      updatedAt: Date.now()
    });
  }, [metadata.tags, updateMetadata]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    updateMetadata({ 
      tags: metadata.tags?.filter(t => t !== tagToRemove) || [],
      updatedAt: Date.now()
    });
  }, [metadata.tags, updateMetadata]);

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

  React.useEffect(() => {
    const selected = nodes.find(n => n.selected);
    setSelectedNodeId(selected?.id);
  }, [nodes]);

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
          onMove={(event, viewport) => setViewport(viewport)}
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

        {/* Workflow Toolbar */}
        <WorkflowToolbar
          workflowName={metadata.name}
          workflowId={metadata.id}
          tags={metadata.tags || []}
          nodeCount={nodes.length}
          edgeCount={edges.length}
          isExecuting={isExecuting}
          onExecute={handleExecute}
          onUpdateName={handleUpdateName}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onExport={handleSave}
          onImport={handleLoad}
          onAutoLayout={handleAutoLayout}
          onReset={handleReset}
          onSaveWorkflow={saveWorkflow}
          onLoadWorkflow={(workflow) => {
            loadWorkflow(workflow);
            // Apply the saved viewport and then fit view
            setTimeout(() => {
              if (workflow.flow.viewport) {
                setReactFlowViewport(workflow.flow.viewport, { duration: 300 });
              } else {
                fitView({ duration: 300 });
              }
            }, 100);
          }}
          nodes={nodes}
          edges={edges}
        />

        {/* Bottom Panel - Instructions */}
        <BottomInstructionsPanel />
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

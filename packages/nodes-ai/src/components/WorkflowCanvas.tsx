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
import { AIAgentNodeV6 as AIAgentNode } from '../nodes/AIAgentNodeV6/index';
import { GenerateNode } from '../nodes/GenerateNode';
import { ImageGenerationNode } from '../nodes/ImageGenerationNode';
import { AudioTTSNode } from '../nodes/AudioTTSNode';
import { VideoGenerationNode } from '../nodes/VideoGenerationNode';
import { RerankNode } from '../nodes/RerankNode';
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
import { executeWorkflow, validateWorkflow } from '../utils/executionEngine';
import { useNotifications } from '../context/NotificationContext';
import { WorkflowToolbar, BottomInstructionsPanel } from './_components';
import type { SavedWorkflowsPanelHandle } from './SavedWorkflowsPanel';

const NODE_TYPES = {
  start: StartNode,
  stop: StopNode,
  'ai-agent': AIAgentNode,
  generate: GenerateNode,
  'image-generation': ImageGenerationNode,
  'audio-tts': AudioTTSNode,
  'video-generation': VideoGenerationNode,
  rerank: RerankNode,
  transform: TransformNode,
  merge: MergeNode,
  condition: ConditionNode,
  template: TemplateNode,
  'http-request': HttpRequestNode,
  loop: LoopNode,
  'file-upload': FileUploadNode,
  splitter: SplitterNode,
  aggregator: AggregatorNode,
  cache: CacheNode,
  guardrail: GuardrailNode,
  'web-scrape': WebScrapeNode,
  'document-ingest': DocumentIngestNode,
  'retrieval-qa': RetrievalQANode,
  'web-search': WebSearchNode,
} as const;

const DEFAULT_EDGE_OPTIONS = {
  animated: true,
  style: { strokeWidth: 2 },
} as const;

const WorkflowCanvasComponent: React.FC = () => {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const updateNode = useFlowStore((s) => s.updateNode);
  const batchUpdateNodes = useFlowStore((s) => s.batchUpdateNodes);
  const resetWorkflow = useFlowStore((s) => s.resetWorkflow);
  const exportWorkflow = useFlowStore((s) => s.exportWorkflow);
  const importWorkflow = useFlowStore((s) => s.importWorkflow);
  const saveWorkflow = useFlowStore((s) => s.saveWorkflow);
  const loadWorkflow = useFlowStore((s) => s.loadWorkflow);
  const isExecuting = useFlowStore((s) => s.isExecuting);
  const startExecution = useFlowStore((s) => s.startExecution);
  const stopExecution = useFlowStore((s) => s.stopExecution);
  const metadata = useFlowStore((s) => s.metadata);
  const workflowVersion = useFlowStore((s) => s.workflowVersion);
  const updateMetadata = useFlowStore((s) => s.updateMetadata);
  const autoLayoutNodes = useFlowStore((s) => s.autoLayoutNodes);
  const setViewport = useFlowStore((s) => s.setViewport);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedWorkflowsPanelRef = useRef<SavedWorkflowsPanelHandle>(null!);
  const { fitView, setViewport: setReactFlowViewport, setNodes: setReactFlowNodes, setEdges: setReactFlowEdges } = useReactFlow();
  const notifications = useNotifications();

  const handleExecute = useCallback(async () => {
    const { nodes: currentNodes, edges: currentEdges } = useFlowStore.getState();
    const validation = validateWorkflow(currentNodes, currentEdges);
    if (!validation.valid) {
      await notifications.showAlert(
        `Workflow validation failed:\n\n${validation.errors.join('\n')}`,
        'Validation Error'
      );
      return;
    }

    startExecution();

    try {
      await executeWorkflow(currentNodes, currentEdges, {
        onNodeUpdate: (nodeId, updates) => {
          updateNode(nodeId, updates);
        },
        batchUpdateNodes,
      });
      notifications.showToast('Workflow executed successfully!', 'success');
    } catch (error: any) {
      notifications.showToast(`Workflow execution failed: ${error.message}`, 'destructive');
    } finally {
      stopExecution();
    }
  }, [startExecution, stopExecution, updateNode, notifications]);

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
          const parsedWorkflow = JSON.parse(json);
          importWorkflow(json);
          setTimeout(() => fitView({ duration: 300 }), 100);
          notifications.showToast('Workflow loaded successfully!', 'success');

          const shouldSave = await notifications.showConfirm(
            'Save this imported workflow to your library to enable autosave?',
            'Save Imported Workflow'
          );

          if (shouldSave) {
            const suggestedName =
              parsedWorkflow?.metadata?.name?.trim() || `Imported Workflow ${new Date().toLocaleString()}`;
            const name = await notifications.showPrompt(
              'Enter a name for this workflow:',
              suggestedName
            );

            if (name) {
              const trimmedName = name.trim();
              if (!trimmedName) {
                notifications.showToast('Workflow name cannot be empty.', 'destructive');
                return;
              }
              if (!savedWorkflowsPanelRef.current) {
                notifications.showToast('Saved workflows panel unavailable. Please save manually from the toolbar.', 'destructive');
                return;
              }
              try {
                await savedWorkflowsPanelRef.current.saveCurrentWorkflow(trimmedName);
                notifications.showToast('Imported workflow saved to library.', 'success');
              } catch (saveError) {
                console.error('Failed to save imported workflow:', saveError);
                notifications.showToast('Failed to save imported workflow', 'destructive');
              }
            }
          }
        } catch (error) {
          notifications.showToast('Failed to load workflow. Invalid file format.', 'destructive');
        }
      };
      reader.readAsText(file);

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

  const handleUpdateName = useCallback(
    (name: string) => {
      updateMetadata({ name, updatedAt: Date.now() });
    },
    [updateMetadata]
  );

  const handleAddTag = useCallback(
    (tag: string) => {
      updateMetadata({
        tags: [...(metadata.tags || []), tag],
        updatedAt: Date.now(),
      });
    },
    [metadata.tags, updateMetadata]
  );

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      updateMetadata({
        tags: metadata.tags?.filter((t) => t !== tagToRemove) || [],
        updatedAt: Date.now(),
      });
    },
    [metadata.tags, updateMetadata]
  );

  const handleAutoLayout = useCallback(() => {
    autoLayoutNodes();
    setTimeout(() => fitView({ duration: 300 }), 50);
    notifications.showToast('Nodes auto-arranged', 'success');
  }, [autoLayoutNodes, fitView, notifications]);

  const handleViewportMove = useCallback(
    (_event: any, viewport: { x: number; y: number; zoom: number }) => {
      setViewport(viewport);
    },
    [setViewport]
  );

  useKeyboardShortcuts({
    onExecute: handleExecute,
    onSave: handleSave,
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
          key={`${metadata.id}-${workflowVersion}`}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onMove={handleViewportMove}
          nodeTypes={NODE_TYPES}
          defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
          fitView
          minZoom={0.1}
          maxZoom={2}
          nodesDraggable
          selectNodesOnDrag={false}
          snapToGrid={false}
          
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            pannable
            zoomable
            style={{ backgroundColor: 'var(--gothic-charcoal)' }}
          />

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
              // Load the workflow - this will update the store and increment workflowVersion
              // The workflowVersion in the key prop will force React Flow to remount
              loadWorkflow(workflow);
              
              // Update viewport after React has processed the state update
              requestAnimationFrame(() => {
                setTimeout(() => {
                  if (workflow.flow.viewport) {
                    setReactFlowViewport(workflow.flow.viewport, { duration: 300 });
                  } else {
                    fitView({ duration: 300 });
                  }
                }, 100);
              });
            }}
            nodes={nodes}
            edges={edges}
            savedWorkflowsRef={savedWorkflowsPanelRef}
          />

          <BottomInstructionsPanel />
        </ReactFlow>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export const WorkflowCanvas = React.memo(WorkflowCanvasComponent);
WorkflowCanvas.displayName = 'WorkflowCanvas';

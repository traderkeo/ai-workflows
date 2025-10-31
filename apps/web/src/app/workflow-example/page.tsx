'use client';
import { useCallback, useMemo, useState } from 'react';
import { 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge as addReactFlowEdge,
  type Connection as ReactFlowConnection, 
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import { WorkflowCanvas } from './_components/WorkflowCanvas';
import { ToolbarPanel } from './_components/ToolbarPanel';
import { createNodeTypes } from './_components/NodeFactory';
import {
  EditTextNodeDialog,
  EditStructuredDataNodeDialog,
  EditConditionalNodeDialog,
  EditStopNodeDialog,
} from './_components/dialogs';
import { useWorkflowStore } from './_components/store/useWorkflowStore';
import type { 
  WorkflowNode, 
  WorkflowEdge, 
  WorkflowNodeData,
  TextNodeData,
  StructuredDataNodeData,
  ConditionalNodeData,
  StopNodeData,
} from './_components/types';

const initialNodes: WorkflowNode[] = [
  {
    id: 'start',
    type: 'text',
    position: { x: 0, y: 0 },
    data: {
      type: 'text',
      label: 'Start',
      description: 'Initialize workflow with text input',
      handles: { target: false, source: true },
      input: 'User input text',
      status: 'idle',
    },
  },
  {
    id: 'process1',
    type: 'text',
    position: { x: 500, y: 0 },
    data: {
      type: 'text',
      label: 'Generate Text',
      description: 'Process and generate text response',
      handles: { target: true, source: true },
      input: 'Processing input...',
      output: 'Generated text response',
      status: 'completed',
    },
  },
  {
    id: 'decision',
    type: 'conditional',
    position: { x: 1000, y: 0 },
    data: {
      type: 'conditional',
      label: 'Decision Point',
      description: 'Route based on conditions',
      handles: { target: true, source: true },
      condition: "data.status === 'valid' && data.score > 0.8",
      branches: [
        { id: 'if', label: 'If', condition: 'valid' },
        { id: 'else', label: 'Else', condition: 'invalid' },
      ],
      status: 'idle',
    },
  },
  {
    id: 'structured',
    type: 'structured',
    position: { x: 1500, y: -200 },
    data: {
      type: 'structured',
      label: 'Extract Data',
      description: 'Extract structured data from text',
      handles: { target: true, source: true },
      input: 'Raw text input',
      schema: {
        name: 'string',
        age: 'number',
        email: 'string',
      },
      output: {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      },
      status: 'completed',
    },
  },
  {
    id: 'stop',
    type: 'stop',
    position: { x: 2000, y: 0 },
    data: {
      type: 'stop',
      label: 'Stop',
      description: 'Terminate workflow path',
      handles: { target: true, source: false },
      reason: 'Workflow completed successfully',
      status: 'stopped',
    },
  },
];

const initialEdges: WorkflowEdge[] = [
  {
    id: 'edge1',
    source: 'start',
    target: 'process1',
    type: 'animated',
  },
  {
    id: 'edge2',
    source: 'process1',
    target: 'decision',
    type: 'animated',
  },
  {
    id: 'edge3',
    source: 'decision',
    sourceHandle: 'if',
    target: 'structured',
    type: 'animated',
  },
  {
    id: 'edge4',
    source: 'structured',
    target: 'stop',
    type: 'animated',
  },
];

export default function WorkflowExamplePage() {
  const {
    nodes,
    edges,
    nextNodeId,
    updateNodes,
    updateEdges,
    updateNodeData,
    addNode,
    removeNode,
    addEdge,
    getNode,
    savedWorkflows,
    saveCurrentWorkflow,
    loadWorkflowById,
    deleteSavedWorkflow,
    exportWorkflow,
  } = useWorkflowStore(initialNodes, initialEdges);

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // Get the currently editing node - depend on nodes directly to ensure updates
  const editingNode = useMemo(() => {
    return editingNodeId ? nodes.find((node) => node.id === editingNodeId) ?? null : null;
  }, [editingNodeId, nodes]);

  // Handle node changes (drag, select, etc.)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      updateNodes((nds) => applyNodeChanges(changes, nds) as WorkflowNode[]);
    },
    [updateNodes]
  );

  // Handle edge changes (select, delete, etc.)
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      updateEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [updateEdges]
  );

  // Handle new connections between nodes
  const onConnect = useCallback(
    (connection: ReactFlowConnection) => {
      const newEdge: WorkflowEdge = {
        id: `edge-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'animated',
      };
      addEdge(newEdge);
    },
    [addEdge]
  );

  // Handle node edit
  const handleNodeEdit = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
  }, []);

  // Handle save edited node
  const handleSaveNode = useCallback((data: WorkflowNodeData) => {
    const nodeId = editingNodeId;
    if (!nodeId) {
      console.warn('Cannot save: editingNodeId is not set');
      return;
    }
    
    // Update the node data
    updateNodeData(nodeId, data);
    // Note: Dialog will call onOpenChange(false) to close itself
  }, [editingNodeId, updateNodeData]);

  // Handle node delete
  const handleNodeDelete = useCallback((nodeId: string) => {
    removeNode(nodeId);
  }, [removeNode]);

  // Add a new node to the workflow
  const addNewNode = useCallback((nodeType: WorkflowNodeData['type']) => {
    const getDefaultData = (type: WorkflowNodeData['type']): WorkflowNodeData => {
      switch (type) {
        case 'text':
          return {
            type: 'text',
            label: `Text Node ${nextNodeId}`,
            description: 'Generate text from input',
            handles: { target: true, source: true },
            status: 'idle',
          };
        case 'structured':
          return {
            type: 'structured',
            label: `Structured Node ${nextNodeId}`,
            description: 'Extract structured data from text',
            handles: { target: true, source: true },
            status: 'idle',
          };
        case 'conditional':
          return {
            type: 'conditional',
            label: `Conditional Node ${nextNodeId}`,
            description: 'Route workflow based on conditions',
            handles: { target: true, source: true },
            branches: [
              { id: 'if', label: 'If', condition: 'true' },
              { id: 'else', label: 'Else', condition: 'false' },
            ],
            status: 'idle',
          };
        case 'stop':
          return {
            type: 'stop',
            label: `Stop Node ${nextNodeId}`,
            description: 'Terminate workflow path',
            handles: { target: true, source: false },
            status: 'idle',
          };
      }
    };

    const newNode: WorkflowNode = {
      id: `node-${nextNodeId}`,
      type: nodeType,
      position: { 
        x: Math.random() * 1000 + 200, 
        y: Math.random() * 600 + 100 
      },
      data: getDefaultData(nodeType),
    };
    
    addNode(newNode);
  }, [nextNodeId, addNode]);

  // Get workflow data for export menu
  const workflowData = useMemo(() => exportWorkflow(), [exportWorkflow]);

  const handleSaveWorkflow = useCallback(() => {
    const defaultName = `Workflow ${new Date().toLocaleString()}`;
    const name = window.prompt('Save workflow as:', defaultName);
    if (!name) {
      return;
    }
    saveCurrentWorkflow(name);
  }, [saveCurrentWorkflow]);

  const handleLoadWorkflow = useCallback((workflowId: string) => {
    loadWorkflowById(workflowId);
  }, [loadWorkflowById]);

  const handleDeleteWorkflow = useCallback((workflowId: string) => {
    const confirmed = window.confirm('Delete this saved workflow?');
    if (!confirmed) {
      return;
    }
    deleteSavedWorkflow(workflowId);
  }, [deleteSavedWorkflow]);

  // Create node types with handlers
  const nodeTypes = useMemo(
    () => createNodeTypes(handleNodeEdit, handleNodeDelete),
    [handleNodeEdit, handleNodeDelete]
  );

  // Get dialog component for editing node
  const renderEditDialog = () => {
    if (!editingNode) return null;

    const { type, data } = editingNode;

    switch (type) {
      case 'text':
        return (
          <EditTextNodeDialog
            key={editingNode.id} // Key ensures dialog updates when node changes
            open={!!editingNode}
            onOpenChange={(open) => !open && setEditingNodeId(null)}
            nodeData={data as TextNodeData}
            onSave={handleSaveNode}
          />
        );
      case 'structured':
        return (
          <EditStructuredDataNodeDialog
            key={editingNode.id}
            open={!!editingNode}
            onOpenChange={(open) => !open && setEditingNodeId(null)}
            nodeData={data as StructuredDataNodeData}
            onSave={handleSaveNode}
          />
        );
      case 'conditional':
        return (
          <EditConditionalNodeDialog
            key={editingNode.id}
            open={!!editingNode}
            onOpenChange={(open) => !open && setEditingNodeId(null)}
            nodeData={data as ConditionalNodeData}
            onSave={handleSaveNode}
          />
        );
      case 'stop':
        return (
          <EditStopNodeDialog
            key={editingNode.id}
            open={!!editingNode}
            onOpenChange={(open) => !open && setEditingNodeId(null)}
            nodeData={data as StopNodeData}
            onSave={handleSaveNode}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 text-center h-[100vh] w-[100vw]">
      <div className="space-y-4" style={{ height: '100%', width: '100%' }}>
        <WorkflowCanvas
          edges={edges}
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        >
          <ToolbarPanel 
            onAddNode={addNewNode} 
            workflowData={workflowData}
            onSaveWorkflow={handleSaveWorkflow}
            savedWorkflows={savedWorkflows}
            onLoadWorkflow={handleLoadWorkflow}
            onDeleteWorkflow={handleDeleteWorkflow}
          />
        </WorkflowCanvas>
      </div>
      {renderEditDialog()}
    </main>
  );
}
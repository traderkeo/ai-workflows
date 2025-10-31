'use client';

import { useCallback, useState } from 'react';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  ConnectionMode,
  type Connection as ReactFlowConnection,
  type Node as ReactFlowNode,
  type Edge as ReactFlowEdge,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import { Canvas } from '@/components/ai-elements/canvas';
import { Connection } from '@/components/ai-elements/connection';
import { Controls } from '@/components/ai-elements/controls';
import { Edge } from '@/components/ai-elements/edge';
import { Panel } from '@/components/ai-elements/panel';
import { WorkflowNode } from '@/components/workflow/workflow-node';
import { NodePalette } from '@/components/workflow/node-palette';
import { NodeConfigPanel } from '@/components/workflow/node-config-panel';
import { WorkflowToolbar } from '@/components/workflow/workflow-toolbar';
import { WorkflowNodeData, WorkflowNodeType } from '@/lib/workflow/types';

const nodeTypes = {
  trigger: WorkflowNode,
  action: WorkflowNode,
  logic: WorkflowNode,
  transform: WorkflowNode,
};

const edgeTypes = {
  default: Edge.Animated,
  animated: Edge.Animated,
  temporary: Edge.Temporary,
};

export default function WorkflowBuilderPage() {
  const [nodes, setNodes] = useState<ReactFlowNode<WorkflowNodeData>[]>([]);
  const [edges, setEdges] = useState<ReactFlowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<ReactFlowNode<WorkflowNodeData> | null>(null);
  const [nextNodeId, setNextNodeId] = useState(1);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  const onConnect = useCallback(
    (connection: ReactFlowConnection) => {
      const newEdge: ReactFlowEdge = {
        id: `edge-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        type: 'animated',
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    []
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: ReactFlowNode<WorkflowNodeData>) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNode = useCallback((nodeType: WorkflowNodeType, config: Partial<WorkflowNodeData>) => {
    const newNode: ReactFlowNode<WorkflowNodeData> = {
      id: `node-${nextNodeId}`,
      type: nodeType,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        nodeType,
        label: config.label || `${nodeType} Node`,
        description: config.description || '',
        icon: config.icon || '⚡',
        config: config.config || {},
        handles: { target: nodeType !== 'trigger', source: true },
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNextNodeId((id) => id + 1);
  }, [nextNodeId]);

  const updateNode = useCallback((nodeId: string, updates: Partial<WorkflowNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  const clearWorkflow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setNextNodeId(1);
  }, []);

  return (
    <div className="flex h-screen w-screen bg-zinc-950">
      {/* Node Palette - Left Sidebar */}
      <NodePalette onAddNode={addNode} />

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <Canvas
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineComponent={Connection}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={{ type: 'animated' }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Controls />
          <Panel position="top-center">
            <WorkflowToolbar
              onClear={clearWorkflow}
              onSave={() => console.log('Save workflow', { nodes, edges })}
              onLoad={() => console.log('Load workflow')}
              onExecute={() => console.log('Execute workflow')}
            />
          </Panel>
        </Canvas>
      </div>

      {/* Configuration Panel - Right Sidebar */}
      <NodeConfigPanel
        node={selectedNode}
        onUpdate={(updates) => selectedNode && updateNode(selectedNode.id, updates)}
        onDelete={() => selectedNode && deleteNode(selectedNode.id)}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}

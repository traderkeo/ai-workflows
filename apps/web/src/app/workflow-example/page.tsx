'use client';
import { useCallback, useState, useMemo } from 'react';
import { applyNodeChanges, applyEdgeChanges, addEdge, ConnectionMode, type Connection as ReactFlowConnection, type Node as ReactFlowNode, type Edge as ReactFlowEdge, type NodeChange, type EdgeChange } from '@xyflow/react';
import { Canvas } from '@/components/ai-elements/canvas';
import { Connection } from '@/components/ai-elements/connection';
import { Controls } from '@/components/ai-elements/controls';
import { Edge } from '@/components/ai-elements/edge';
import {
  Node,
  NodeContent,
  NodeDescription,
  NodeFooter,
  NodeHeader,
  NodeTitle,
} from '@/components/ai-elements/node';
import { Panel } from '@/components/ai-elements/panel';
import { Toolbar } from '@/components/ai-elements/toolbar';
import { Button } from '@/components/ui/button';

type WorkflowData = {
  label: string;
  description: string;
  handles: { target: boolean; source: boolean };
  content: string;
  footer: string;
};

type WorkflowNode = ReactFlowNode<WorkflowData>;

type WorkflowEdge = ReactFlowEdge;

const initialNodeIds = {
    start: 'start',
    process1: 'process1',
    process2: 'process2',
    decision: 'decision',
    output1: 'output1',
    output2: 'output2',
  };

  const initialNodes: WorkflowNode[] = [
    {
      id: initialNodeIds.start,
      type: 'workflow',
      position: { x: 0, y: 0 },
      data: {
        label: 'Start',
        description: 'Initialize workflow',
        handles: { target: false, source: true },
        content: 'Triggered by user action at 09:30 AM',
        footer: 'Status: Ready',
      },
    },
    {
      id: initialNodeIds.process1,
      type: 'workflow',
      position: { x: 500, y: 0 },
      data: {
        label: 'Process Data',
        description: 'Transform input',
        handles: { target: true, source: true },
        content: 'Validating 1,234 records and applying business rules',
        footer: 'Duration: ~2.5s',
      },
    },
    {
      id: initialNodeIds.decision,
      type: 'workflow',
      position: { x: 1000, y: 0 },
      data: {
        label: 'Decision Point',
        description: 'Route based on conditions',
        handles: { target: true, source: true },
        content: "Evaluating: data.status === 'valid' && data.score > 0.8",
        footer: 'Confidence: 94%',
      },
    },
    {
      id: initialNodeIds.output1,
      type: 'workflow',
      position: { x: 1500, y: -300 },
      data: {
        label: 'Success Path',
        description: 'Handle success case',
        handles: { target: true, source: true },
        content: '1,156 records passed validation (93.7%)',
        footer: 'Next: Send to production',
      },
    },
    {
      id: initialNodeIds.output2,
      type: 'workflow',
      position: { x: 1500, y: 300 },
      data: {
        label: 'Error Path',
        description: 'Handle error case',
        handles: { target: true, source: true },
        content: '78 records failed validation (6.3%)',
        footer: 'Next: Queue for review',
      },
    },
    {
      id: initialNodeIds.process2,
      type: 'workflow',
      position: { x: 2000, y: 0 },
      data: {
        label: 'Complete',
        description: 'Finalize workflow',
        handles: { target: true, source: false },
        content: 'All records processed and routed successfully',
        footer: 'Total time: 4.2s',
      },
    },
  ];

  const initialEdges: WorkflowEdge[] = [
    {
      id: 'edge1',
      source: initialNodeIds.start,
      target: initialNodeIds.process1,
      type: 'animated',
    },
    {
      id: 'edge2',
      source: initialNodeIds.process1,
      target: initialNodeIds.decision,
      type: 'animated',
    },
    {
      id: 'edge3',
      source: initialNodeIds.decision,
      target: initialNodeIds.output1,
      type: 'animated',
    },
    {
      id: 'edge4',
      source: initialNodeIds.decision,
      target: initialNodeIds.output2,
      type: 'temporary',
    },
    {
      id: 'edge5',
      source: initialNodeIds.output1,
      target: initialNodeIds.process2,
      type: 'animated',
    },
    {
      id: 'edge6',
      source: initialNodeIds.output2,
      target: initialNodeIds.process2,
      type: 'temporary',
    },
  ];

const nodeTypes = {
    workflow: ({
      data,
    }: {
      data: {
        label: string;
        description: string;
        handles: { target: boolean; source: boolean };
        content: string;
        footer: string;
      };
    }) => (
      <Node handles={data.handles} className="p-2 min-w-[500px]">
        <NodeHeader className="p-2">
          <NodeTitle>{data.label}</NodeTitle>
          <NodeDescription>{data.description}</NodeDescription>
        </NodeHeader>
        <NodeContent>
          <p className="text-sm">{data.content}</p>
        </NodeContent>
        <NodeFooter>
          <p className="text-muted-foreground text-xs">{data.footer}</p>
        </NodeFooter>
        <Toolbar>
          <Button 
          //@ts-ignore
          size="sm" variant="ghost">
            Edit
          </Button>
          <Button 
          //@ts-ignore
          size="sm" variant="ghost">
            Delete
          </Button>
        </Toolbar>
      </Node>
    ),
  };

  const edgeTypes = {
    animated: Edge.Animated,
    temporary: Edge.Temporary,
  };

export default function WorkflowExamplePage() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(initialEdges);
  const [nextNodeId, setNextNodeId] = useState(1);

  // Handle node changes (drag, select, etc.)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges<WorkflowNode>(changes as NodeChange<WorkflowNode>[], nds)),
    []
  );

  // Handle edge changes (select, delete, etc.)
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Handle new connections between nodes
  const onConnect = useCallback(
    (connection: ReactFlowConnection) => {
      const newEdge: WorkflowEdge = {
        id: `edge-${Date.now()}`,
        className: 'animated',
        source: connection.source!,
        target: connection.target!,
        type: 'animated',
      };
      setEdges((eds) => addEdge<WorkflowEdge>(newEdge, eds));
    },
    []
  );

  // Add a new node to the workflow
  const addNewNode = useCallback(() => {
    const newNode: WorkflowNode = {
      id: `node-${nextNodeId}`,
      type: 'workflow',
      className: 'animated',
      position: { x: Math.random() * 1000, y: Math.random() * 600 },
      data: {
        label: `New Node ${nextNodeId}`,
        description: 'A new workflow node',
        handles: { target: true, source: true },
        content: 'This is a dynamically created node',
        footer: 'Ready to connect',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNextNodeId((id) => id + 1);
  }, [nextNodeId]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 text-center h-[100vh] w-[100vw]">
      <div className="space-y-4" style={{ height: '100%', width: '100%' }}>
      <Canvas
    edges={edges}
    edgeTypes={edgeTypes}
    fitView
    nodes={nodes}
    nodeTypes={nodeTypes}
    connectionLineComponent={Connection}
    onNodesChange={onNodesChange}
    onEdgesChange={onEdgesChange}
    onConnect={onConnect}
    connectionMode={ConnectionMode.Loose}
    defaultEdgeOptions={{ type: 'animated' }}
    fitViewOptions={{ padding: 0.2 }}
  >
    <Controls />
    <Panel position="top-left">
      <Button 
      onClick={addNewNode}
      //@ts-ignore
      size="sm" variant="secondary">
        + Add Node
      </Button>
      <Button 
      //@ts-ignore
      size="sm" variant="secondary">
        Export
      </Button>
    </Panel>
  </Canvas>
      </div>
    </main>
  );
}
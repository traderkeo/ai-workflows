'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge, 
  ConnectionMode,
  useReactFlow,
  type Connection as ReactFlowConnection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import { Canvas } from '@/components/ai-elements/canvas';
import { Connection } from '@/components/ai-elements/connection';
import { Controls } from '@/components/ai-elements/controls';
import { Edge } from '@/components/ai-elements/edge';
import type { WorkflowNode, WorkflowEdge } from './types';

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  nodeTypes: Record<string, any>;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: ReactFlowConnection) => void;
  children?: React.ReactNode;
}

// Component that tracks mouse position during connection (must be inside ReactFlow context)
function ConnectionHandler({
  onConnect,
  onHandlersReady,
}: {
  onConnect: (connection: ReactFlowConnection) => void;
  onHandlersReady: (handlers: {
    handleConnectStart: () => void;
    handleConnect: (connection: ReactFlowConnection) => void;
  }) => void;
}) {
  const { getNode, screenToFlowPosition } = useReactFlow();
  const connectionEndPos = useRef<{ x: number; y: number } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Track connection start
  const handleConnectStart = useCallback(() => {
    setIsConnecting(true);
    connectionEndPos.current = null;
  }, []);

  // Track mouse position during connection
  useEffect(() => {
    if (!isConnecting) return;

    const handleMouseMove = (event: MouseEvent) => {
      const projector = typeof screenToFlowPosition === 'function'
        ? screenToFlowPosition
        : undefined;

      const flowPos = projector
        ? projector({ x: event.clientX, y: event.clientY })
        : { x: event.clientX, y: event.clientY };
      connectionEndPos.current = flowPos;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isConnecting, screenToFlowPosition]);

  // Find closest handle to the connection endpoint
  const findClosestHandle = useCallback(
    (targetNodeId: string, handleType: 'target' | 'source', mousePos: { x: number; y: number }): string | null => {
      const targetNode = getNode(targetNodeId);
      if (!targetNode) {
        return null;
      }

      const handleBounds = targetNode.internals?.handleBounds?.[handleType];
      if (!handleBounds || handleBounds.length === 0) {
        return null;
      }

      const nodeX = targetNode.positionAbsolute?.x ?? targetNode.position.x;
      const nodeY = targetNode.positionAbsolute?.y ?? targetNode.position.y;

      let closestHandle: { id: string | null; distance: number } = { id: null, distance: Infinity };

      for (const handle of handleBounds) {
        const handleX = nodeX + handle.x + handle.width / 2;
        const handleY = nodeY + handle.y + handle.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(mousePos.x - handleX, 2) + Math.pow(mousePos.y - handleY, 2)
        );

        if (distance < closestHandle.distance) {
          closestHandle = { id: handle.id ?? null, distance };
        }
      }

      return closestHandle.id;
    },
    [getNode]
  );

  // Enhanced onConnect that finds closest handle
  const handleConnect = useCallback(
    (connection: ReactFlowConnection) => {
      setIsConnecting(false);
      
      if (!connection.target || !connectionEndPos.current) {
        onConnect(connection);
        connectionEndPos.current = null;
        return;
      }

      // Determine handle type based on connection direction
      const handleType: 'target' | 'source' = connection.source ? 'target' : 'source';
      
      // Find closest handle to where the connection was dropped
      const closestHandleId = findClosestHandle(
        connection.target,
        handleType,
        connectionEndPos.current
      );

      // If we found a closer handle than what React Flow selected, use it
      if (closestHandleId && closestHandleId !== connection.targetHandle) {
        onConnect({
          ...connection,
          targetHandle: closestHandleId,
        });
      } else {
        onConnect(connection);
      }

      connectionEndPos.current = null;
    },
    [onConnect, findClosestHandle]
  );

  // Keep handlers in ref to avoid stale closures
  const handlersRef = useRef({ handleConnectStart, handleConnect });
  handlersRef.current = { handleConnectStart, handleConnect };

  // Expose handlers to parent - update whenever handlers change
  useEffect(() => {
    onHandlersReady(handlersRef.current);
  }, [handleConnectStart, handleConnect, onHandlersReady]);

  return null; // This component doesn't render anything
}

export function WorkflowCanvas({
  nodes,
  edges,
  nodeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  children,
}: WorkflowCanvasProps) {
  const connectionHandlersRef = useRef<{
    handleConnectStart: () => void;
    handleConnect: (connection: ReactFlowConnection) => void;
  } | null>(null);

  const edgeTypes = {
    animated: Edge.Animated,
    temporary: Edge.Temporary,
  };

  // Handler wrapper that calls our custom logic
  const handleConnectInternal = useCallback(
    (connection: ReactFlowConnection) => {
      if (connectionHandlersRef.current) {
        connectionHandlersRef.current.handleConnect(connection);
      } else {
        onConnect(connection);
      }
    },
    [onConnect]
  );

  const handleConnectStart = useCallback(() => {
    if (connectionHandlersRef.current) {
      connectionHandlersRef.current.handleConnectStart();
    }
  }, []);

  const handleHandlersReady = useCallback((handlers: {
    handleConnectStart: () => void;
    handleConnect: (connection: ReactFlowConnection) => void;
  }) => {
    connectionHandlersRef.current = handlers;
  }, []);

  return (
    <Canvas
      edges={edges}
      edgeTypes={edgeTypes}
      fitView
      nodes={nodes}
      nodeTypes={nodeTypes}
      connectionLineComponent={Connection}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnectInternal}
      onConnectStart={handleConnectStart}
      connectionMode={ConnectionMode.Loose}
      defaultEdgeOptions={{ type: 'animated' }}
      fitViewOptions={{ padding: 0.2 }}
      connectionRadius={30}
    >
      <ConnectionHandler 
        onConnect={onConnect}
        onHandlersReady={handleHandlersReady}
      />
      <Controls />
      {children}
    </Canvas>
  );
}

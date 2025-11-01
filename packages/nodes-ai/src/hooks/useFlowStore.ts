import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
} from '@xyflow/react';
import type { AINode, AIEdge, FlowState, WorkflowMetadata, SavedWorkflow, ExecutionContext } from '../types';

interface FlowStore {
  // Flow state
  nodes: AINode[];
  edges: AIEdge[];

  // Viewport
  viewport: { x: number; y: number; zoom: number };

  // Metadata
  metadata: WorkflowMetadata;

  // Execution state
  executionContext: ExecutionContext | null;
  isExecuting: boolean;

  // Actions
  setNodes: (nodes: AINode[]) => void;
  setEdges: (edges: AIEdge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  // Node operations
  addNode: (node: AINode) => void;
  updateNode: (nodeId: string, data: Partial<AINode['data']>) => void;
  deleteNode: (nodeId: string) => void;

  // Edge operations
  deleteEdge: (edgeId: string) => void;

  // Viewport
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;

  // Workflow operations
  saveWorkflow: () => SavedWorkflow;
  loadWorkflow: (workflow: SavedWorkflow) => void;
  exportWorkflow: () => string;
  importWorkflow: (json: string) => void;
  resetWorkflow: () => void;

  // Metadata
  updateMetadata: (metadata: Partial<WorkflowMetadata>) => void;

  // Execution
  startExecution: () => void;
  stopExecution: () => void;
  setExecutionContext: (context: ExecutionContext | null) => void;
}

// Initial state
const initialNodes: AINode[] = [];
const initialEdges: AIEdge[] = [];
const initialViewport = { x: 0, y: 0, zoom: 1 };

const initialMetadata: WorkflowMetadata = {
  id: crypto.randomUUID(),
  name: 'Untitled Workflow',
  description: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: '1.0.0',
};

export const useFlowStore = create<FlowStore>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: initialNodes,
      edges: initialEdges,
      viewport: initialViewport,
      metadata: initialMetadata,
      executionContext: null,
      isExecuting: false,

      // Node/Edge changes
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes as any[]) as any,
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges as any[]) as any,
        });
      },

      onConnect: (connection: Connection) => {
        set({
          edges: addEdge(connection, get().edges as any[]) as any,
        });
      },

      // Node operations
      addNode: (node) => {
        set({ nodes: [...get().nodes, node] });
        get().updateMetadata({ updatedAt: Date.now() });
      },

      updateNode: (nodeId, data) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
          ),
        });
        get().updateMetadata({ updatedAt: Date.now() });
      },

      deleteNode: (nodeId) => {
        set({
          nodes: get().nodes.filter((node) => node.id !== nodeId),
          edges: get().edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
        });
        get().updateMetadata({ updatedAt: Date.now() });
      },

      // Edge operations
      deleteEdge: (edgeId) => {
        set({
          edges: get().edges.filter((edge) => edge.id !== edgeId),
        });
        get().updateMetadata({ updatedAt: Date.now() });
      },

      // Viewport
      setViewport: (viewport) => set({ viewport }),

      // Workflow operations
      saveWorkflow: () => {
        const { nodes, edges, viewport, metadata } = get();
        const workflow: SavedWorkflow = {
          metadata: {
            ...metadata,
            updatedAt: Date.now(),
          },
          flow: {
            nodes,
            edges,
            viewport,
          },
        };
        return workflow;
      },

      loadWorkflow: (workflow) => {
        set({
          nodes: workflow.flow.nodes,
          edges: workflow.flow.edges,
          viewport: workflow.flow.viewport,
          metadata: workflow.metadata,
        });
      },

      exportWorkflow: () => {
        const workflow = get().saveWorkflow();
        return JSON.stringify(workflow, null, 2);
      },

      importWorkflow: (json) => {
        try {
          const workflow: SavedWorkflow = JSON.parse(json);
          get().loadWorkflow(workflow);
        } catch (error) {
          console.error('Failed to import workflow:', error);
          throw new Error('Invalid workflow JSON');
        }
      },

      resetWorkflow: () => {
        set({
          nodes: [],
          edges: [],
          viewport: initialViewport,
          metadata: {
            id: crypto.randomUUID(),
            name: 'Untitled Workflow',
            description: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: '1.0.0',
          },
          executionContext: null,
          isExecuting: false,
        });
      },

      // Metadata
      updateMetadata: (metadata) => {
        set({
          metadata: {
            ...get().metadata,
            ...metadata,
            updatedAt: Date.now(),
          },
        });
      },

      // Execution
      startExecution: () => {
        set({
          isExecuting: true,
          executionContext: {
            nodeResults: new Map(),
            errors: new Map(),
            startTime: Date.now(),
          },
        });
      },

      stopExecution: () => {
        set({
          isExecuting: false,
        });
      },

      setExecutionContext: (context) => {
        set({ executionContext: context });
      },
    }),
    {
      name: 'ai-workflow-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
        metadata: state.metadata,
      }),
    }
  )
);

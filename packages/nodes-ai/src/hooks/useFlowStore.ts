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
import { autoLayout } from '../utils/autoLayout';

interface HistoryState {
  nodes: AINode[];
  edges: AIEdge[];
}

interface FlowStore {
  // Flow state
  nodes: AINode[];
  edges: AIEdge[];

  // History
  history: HistoryState[];
  historyIndex: number;

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
  deleteSelectedNodes: () => void;
  duplicateSelectedNodes: () => void;
  selectAllNodes: () => void;

  // Edge operations
  deleteEdge: (edgeId: string) => void;

  // Viewport
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;

  // Layout
  autoLayoutNodes: () => void;

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

const MAX_HISTORY = 50;

export const useFlowStore = create<FlowStore>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: initialNodes,
      edges: initialEdges,
      history: [],
      historyIndex: -1,
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
        // Save to history for certain change types
        const shouldSaveHistory = changes.some(
          (change) => change.type === 'remove' || change.type === 'add'
        );
        if (shouldSaveHistory) {
          get().saveToHistory();
        }
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
        get().saveToHistory();
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
        get().saveToHistory();
        set({
          nodes: get().nodes.filter((node) => node.id !== nodeId),
          edges: get().edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
        });
        get().updateMetadata({ updatedAt: Date.now() });
      },

      deleteSelectedNodes: () => {
        const selectedNodes = get().nodes.filter((node) => node.selected);
        if (selectedNodes.length === 0) return;

        get().saveToHistory();
        const selectedIds = new Set(selectedNodes.map((n) => n.id));
        set({
          nodes: get().nodes.filter((node) => !selectedIds.has(node.id)),
          edges: get().edges.filter(
            (edge) => !selectedIds.has(edge.source) && !selectedIds.has(edge.target)
          ),
        });
        get().updateMetadata({ updatedAt: Date.now() });
      },

      duplicateSelectedNodes: () => {
        const selectedNodes = get().nodes.filter((node) => node.selected);
        if (selectedNodes.length === 0) return;

        get().saveToHistory();
        const duplicates = selectedNodes.map((node) => ({
          ...node,
          id: `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
          selected: false,
          data: {
            ...node.data,
            name: node.data.name ? `${node.data.name} (copy)` : undefined,
          },
        }));

        set({ nodes: [...get().nodes, ...duplicates] });
        get().updateMetadata({ updatedAt: Date.now() });
      },

      selectAllNodes: () => {
        set({
          nodes: get().nodes.map((node) => ({ ...node, selected: true })),
        });
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

      // History
      saveToHistory: () => {
        const { nodes, edges, history, historyIndex } = get();

        // Trim history if we're not at the end
        const newHistory = history.slice(0, historyIndex + 1);

        // Add current state
        newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });

        // Keep only last MAX_HISTORY items
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const prevState = history[historyIndex - 1];
          set({
            nodes: JSON.parse(JSON.stringify(prevState.nodes)),
            edges: JSON.parse(JSON.stringify(prevState.edges)),
            historyIndex: historyIndex - 1,
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const nextState = history[historyIndex + 1];
          set({
            nodes: JSON.parse(JSON.stringify(nextState.nodes)),
            edges: JSON.parse(JSON.stringify(nextState.edges)),
            historyIndex: historyIndex + 1,
          });
        }
      },

      canUndo: () => {
        const { historyIndex } = get();
        return historyIndex > 0;
      },

      canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
      },

      // Layout
      autoLayoutNodes: () => {
        const { nodes, edges } = get();
        get().saveToHistory();
        const layoutedNodes = autoLayout(nodes, edges);
        set({ nodes: layoutedNodes });
      },

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

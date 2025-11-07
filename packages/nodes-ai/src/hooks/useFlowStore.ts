import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import { produce } from 'immer';
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
import { indexedDBStorage } from './indexedDBStorage';

interface HistoryState {
  nodes: AINode[];
  edges: AIEdge[];
}

interface FlowStore {
  // Flow state
  nodes: AINode[];
  edges: AIEdge[];
  selectedNodeIds: string[];

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
  setSelectedNodeIds: (ids: string[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  // Node operations
  addNode: (node: AINode) => void;
  updateNode: (nodeId: string, data: Partial<AINode['data']>) => void;
  batchUpdateNodes: (updates: Array<{ nodeId: string; data: Partial<AINode['data']> }>) => void;
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
const getSelectedNodeIds = (nodes: AINode[]) =>
  nodes.filter((node) => node.selected).map((node) => node.id);

const deepClone = <T>(value: T): T => {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const createDebouncedStorage = (storage: StateStorage, delay = 250): StateStorage => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let pendingPromise: Promise<void> | null = null;
  let resolvePending: (() => void) | null = null;
  let rejectPending: ((error: unknown) => void) | null = null;
  let lastArgs: [string, string] | null = null;

  const flush = async () => {
    if (!lastArgs) {
      resolvePending?.();
      pendingPromise = null;
      resolvePending = null;
      rejectPending = null;
      return;
    }

    try {
      await storage.setItem(lastArgs[0], lastArgs[1]);
      resolvePending?.();
    } catch (error) {
      rejectPending?.(error);
    } finally {
      lastArgs = null;
      pendingPromise = null;
      resolvePending = null;
      rejectPending = null;
    }
  };

  return {
    ...storage,
    setItem: (name, value) => {
      lastArgs = [name, value];
      if (!pendingPromise) {
        pendingPromise = new Promise<void>((resolve, reject) => {
          resolvePending = resolve;
          rejectPending = reject;
        });
      }

      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        timeout = null;
        flush();
      }, delay);

      return pendingPromise;
    },
  };
};

const debouncedStorage = createDebouncedStorage(indexedDBStorage);

const initialMetadata: WorkflowMetadata = {
  id: crypto.randomUUID(),
  name: 'Untitled Workflow',
  description: '',
  tags: [],
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
      selectedNodeIds: [],
      history: [],
      historyIndex: -1,
      viewport: initialViewport,
      metadata: initialMetadata,
      executionContext: null,
      isExecuting: false,

      // Node/Edge changes
      setNodes: (nodes) =>
        set({
          nodes,
          selectedNodeIds: getSelectedNodeIds(nodes),
        }),
      setEdges: (edges) => set({ edges }),
      setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),

      onNodesChange: (changes) => {
        const updatedNodes = applyNodeChanges(changes, get().nodes as any[]) as AINode[];
        set({
          nodes: updatedNodes,
          selectedNodeIds: getSelectedNodeIds(updatedNodes),
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
        const nodes = [...get().nodes, node];
        set({
          nodes,
          selectedNodeIds: getSelectedNodeIds(nodes),
        });
        get().updateMetadata({ updatedAt: Date.now() });
      },

      updateNode: (nodeId, data) => {
        set((state) => {
          const nodes = produce(state.nodes, (draft) => {
            const node = draft.find((n) => n.id === nodeId);
            if (node) {
              node.data = { ...node.data, ...data };
            }
          });

          return {
            nodes,
            selectedNodeIds: getSelectedNodeIds(nodes),
            metadata: {
              ...state.metadata,
              updatedAt: Date.now(),
            },
          };
        });
      },

      batchUpdateNodes: (updates) => {
        if (!updates.length) {
          return;
        }
        set((state) => {
          const updateMap = new Map<string, Partial<AINode['data']>>();
          updates.forEach(({ nodeId, data }) => {
            const existing = updateMap.get(nodeId);
            updateMap.set(nodeId, { ...(existing || {}), ...data });
          });

          const nodes = produce(state.nodes, (draft) => {
            draft.forEach((node) => {
              const data = updateMap.get(node.id);
              if (data) {
                node.data = { ...node.data, ...data };
              }
            });
          });

          return {
            nodes,
            selectedNodeIds: getSelectedNodeIds(nodes),
            metadata: {
              ...state.metadata,
              updatedAt: Date.now(),
            },
          };
        });
      },

      deleteNode: (nodeId) => {
        get().saveToHistory();
        const nodes = get().nodes.filter((node) => node.id !== nodeId);
        set({
          nodes,
          edges: get().edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
          selectedNodeIds: getSelectedNodeIds(nodes),
        });
        get().updateMetadata({ updatedAt: Date.now() });
      },

      deleteSelectedNodes: () => {
        const selectedNodes = get().nodes.filter((node) => node.selected);
        if (selectedNodes.length === 0) return;

        get().saveToHistory();
        const selectedIds = new Set(selectedNodes.map((n) => n.id));
        const nodes = get().nodes.filter((node) => !selectedIds.has(node.id));
        set({
          nodes,
          edges: get().edges.filter(
            (edge) => !selectedIds.has(edge.source) && !selectedIds.has(edge.target)
          ),
          selectedNodeIds: getSelectedNodeIds(nodes),
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

        const nodes = [...get().nodes, ...duplicates];
        set({
          nodes,
          selectedNodeIds: getSelectedNodeIds(nodes),
        });
        get().updateMetadata({ updatedAt: Date.now() });
      },

      selectAllNodes: () => {
        const nodes = get().nodes.map((node) => ({ ...node, selected: true }));
        set({
          nodes,
          selectedNodeIds: getSelectedNodeIds(nodes),
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
        newHistory.push({ nodes: deepClone(nodes), edges: deepClone(edges) });

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
          const nodes = deepClone(prevState.nodes);
          const edges = deepClone(prevState.edges);
          set({
            nodes,
            edges,
            historyIndex: historyIndex - 1,
            selectedNodeIds: getSelectedNodeIds(nodes),
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const nextState = history[historyIndex + 1];
          const nodes = deepClone(nextState.nodes);
          const edges = deepClone(nextState.edges);
          set({
            nodes,
            edges,
            historyIndex: historyIndex + 1,
            selectedNodeIds: getSelectedNodeIds(nodes),
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
        set({
          nodes: layoutedNodes,
          selectedNodeIds: getSelectedNodeIds(layoutedNodes),
        });
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
        // Batch state updates to prevent multiple re-renders
        set({
          nodes: workflow.flow.nodes,
          edges: workflow.flow.edges,
          viewport: workflow.flow.viewport,
          metadata: workflow.metadata,
          history: [],
          historyIndex: -1,
          selectedNodeIds: getSelectedNodeIds(workflow.flow.nodes),
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
          selectedNodeIds: [],
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
      storage: createJSONStorage(() => debouncedStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
        metadata: state.metadata,
      }),
      // Skip hydration during SSR
      skipHydration: typeof window === 'undefined',
    }
  )
);

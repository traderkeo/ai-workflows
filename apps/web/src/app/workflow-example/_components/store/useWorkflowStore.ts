'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { WorkflowNode, WorkflowEdge, WorkflowNodeData } from '../types';

export interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  nextNodeId: number;
}

const STORAGE_KEY = 'workflow-builder-state';
const SAVED_WORKFLOWS_KEY = 'workflow-saved-workflows';

export interface SavedWorkflow {
  id: string;
  name: string;
  createdAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

const defaultState: WorkflowState = {
  nodes: [],
  edges: [],
  nextNodeId: 1,
};

export function useWorkflowStore(initialNodes?: WorkflowNode[], initialEdges?: WorkflowEdge[]) {
  const baseStateRef = useRef<WorkflowState>({
    nodes: initialNodes || defaultState.nodes,
    edges: initialEdges || defaultState.edges,
    nextNodeId: initialNodes ? initialNodes.length + 1 : defaultState.nextNodeId,
  });

  const [state, setState] = useState<WorkflowState>(baseStateRef.current);
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([]);

  // Synchronize base state if initial data changes (should be rare)
  useEffect(() => {
    baseStateRef.current = {
      nodes: initialNodes || defaultState.nodes,
      edges: initialEdges || defaultState.edges,
      nextNodeId: initialNodes ? initialNodes.length + 1 : defaultState.nextNodeId,
    };
  }, [initialNodes, initialEdges]);

  // Hydrate from localStorage after mount to avoid SSR hydration mismatches
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        setState((prev) => ({
          nodes: Array.isArray(parsed.nodes) && parsed.nodes.length > 0 ? parsed.nodes : prev.nodes,
          edges: Array.isArray(parsed.edges) ? parsed.edges : prev.edges,
          nextNodeId: typeof parsed.nextNodeId === 'number' ? parsed.nextNodeId : prev.nextNodeId,
        }));
      }

      const saved = localStorage.getItem(SAVED_WORKFLOWS_KEY);
      if (saved) {
        const parsedSaved = JSON.parse(saved);
        if (Array.isArray(parsedSaved)) {
          setSavedWorkflows(parsedSaved);
        }
      }
    } catch (error) {
      console.warn('Failed to load workflow state from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save workflow state to localStorage:', error);
    }
  }, [state]);

  // Persist saved workflows
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_WORKFLOWS_KEY, JSON.stringify(savedWorkflows));
    } catch (error) {
      console.warn('Failed to save workflows to localStorage:', error);
    }
  }, [savedWorkflows]);

  // Update nodes
  const updateNodes = useCallback((updater: (nodes: WorkflowNode[]) => WorkflowNode[]) => {
    setState((prev) => ({
      ...prev,
      nodes: updater(prev.nodes),
    }));
  }, []);

  // Update edges
  const updateEdges = useCallback((updater: (edges: WorkflowEdge[]) => WorkflowEdge[]) => {
    setState((prev) => ({
      ...prev,
      edges: updater(prev.edges),
    }));
  }, []);

  // Update a specific node
  const updateNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    updateNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    );
  }, [updateNodes]);

  // Update node data
  const updateNodeData = useCallback((nodeId: string, data: WorkflowNodeData) => {
    updateNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId ? { ...node, data } : node
      )
    );
  }, [updateNodes]);

  // Add node
  const addNode = useCallback((node: WorkflowNode) => {
    setState((prev) => ({
      ...prev,
      nodes: [...prev.nodes, node],
      nextNodeId: prev.nextNodeId + 1,
    }));
  }, []);

  // Remove node
  const removeNode = useCallback((nodeId: string) => {
    updateNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
    updateEdges((edges) =>
      edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
  }, [updateNodes, updateEdges]);

  // Add edge
  const addEdge = useCallback((edge: WorkflowEdge) => {
    updateEdges((edges) => [...edges, edge]);
  }, [updateEdges]);

  // Remove edge
  const removeEdge = useCallback((edgeId: string) => {
    updateEdges((edges) => edges.filter((edge) => edge.id !== edgeId));
  }, [updateEdges]);

  // Get node by ID
  const getNode = useCallback(
    (nodeId: string) => state.nodes.find((node) => node.id === nodeId),
    [state.nodes]
  );

  // Export workflow as JSON
  const exportWorkflow = useCallback(() => {
    const workflowData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      nodes: state.nodes.map((node) => ({
        id: node.id,
        type: node.type || 'text',
        position: node.position,
        data: node.data as Record<string, unknown>,
      })),
      edges: state.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        ...(edge.sourceHandle && { sourceHandle: edge.sourceHandle }),
        ...(edge.targetHandle && { targetHandle: edge.targetHandle }),
        ...(edge.type && { type: edge.type }),
      })),
    };
    return workflowData;
  }, [state]);

  const computeNextNodeId = useCallback((nodes: WorkflowNode[]) => {
    const numericIds = nodes
      .map((node) => {
        const match = node.id.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((value): value is number => value !== null);

    if (numericIds.length === 0) {
      return defaultState.nextNodeId;
    }

    return Math.max(...numericIds) + 1;
  }, []);

  const saveCurrentWorkflow = useCallback((name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const createId = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return `workflow-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    const clone = <T,>(value: T): T => {
      if (typeof structuredClone === 'function') {
        return structuredClone(value);
      }
      return JSON.parse(JSON.stringify(value));
    };

    const newWorkflow: SavedWorkflow = {
      id: createId(),
      name: trimmedName,
      createdAt: new Date().toISOString(),
      nodes: clone(state.nodes),
      edges: clone(state.edges),
    };

    setSavedWorkflows((prev) => [newWorkflow, ...prev]);
  }, [state.nodes, state.edges]);

  const loadWorkflowById = useCallback((workflowId: string) => {
    const workflow = savedWorkflows.find((item) => item.id === workflowId);
    if (!workflow) {
      return;
    }

    const clone = <T,>(value: T): T => {
      if (typeof structuredClone === 'function') {
        return structuredClone(value);
      }
      return JSON.parse(JSON.stringify(value));
    };

    const clonedNodes = clone(workflow.nodes);
    const clonedEdges = clone(workflow.edges);

    setState({
      nodes: clonedNodes,
      edges: clonedEdges,
      nextNodeId: computeNextNodeId(clonedNodes),
    });
  }, [savedWorkflows, computeNextNodeId]);

  const deleteSavedWorkflow = useCallback((workflowId: string) => {
    setSavedWorkflows((prev) => prev.filter((workflow) => workflow.id !== workflowId));
  }, []);

  // Clear workflow
  const clearWorkflow = useCallback(() => {
    setState(defaultState);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Load workflow from JSON
  const loadWorkflow = useCallback((workflowData: {
    nodes?: WorkflowNode[];
    edges?: WorkflowEdge[];
  }) => {
    setState((prev) => ({
      ...prev,
      nodes: workflowData.nodes || prev.nodes,
      edges: workflowData.edges || prev.edges,
    }));
  }, []);

  return {
    nodes: state.nodes,
    edges: state.edges,
    nextNodeId: state.nextNodeId,
    updateNodes,
    updateEdges,
    updateNode,
    updateNodeData,
    addNode,
    removeNode,
    addEdge,
    removeEdge,
    getNode,
    exportWorkflow,
    savedWorkflows,
    saveCurrentWorkflow,
    loadWorkflowById,
    deleteSavedWorkflow,
    clearWorkflow,
    loadWorkflow,
  };
}

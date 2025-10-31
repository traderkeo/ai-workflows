import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react';

/**
 * Base workflow node data structure
 */
export interface BaseWorkflowNodeData extends Record<string, unknown> {
  label: string;
  description: string;
  handles: { target: boolean; source: boolean };
}

/**
 * Text node data - sends text, receives text blob
 */
export interface TextNodeData extends BaseWorkflowNodeData {
  type: 'text';
  input?: string;
  output?: string;
  status?: 'idle' | 'processing' | 'completed' | 'error';
  error?: string;
}

/**
 * Structured data node data - sends text, receives structured data
 */
export interface StructuredDataNodeData extends BaseWorkflowNodeData {
  type: 'structured';
  input?: string;
  schema?: Record<string, any>;
  output?: Record<string, any>;
  status?: 'idle' | 'processing' | 'completed' | 'error';
  error?: string;
}

/**
 * If/Else/Or node data - conditional branching
 */
export interface ConditionalNodeData extends BaseWorkflowNodeData {
  type: 'conditional';
  condition?: string;
  branches?: Array<{
    id: string;
    label: string;
    condition: string;
  }>;
  status?: 'idle' | 'evaluating' | 'routed';
}

/**
 * Stop node data - path termination
 */
export interface StopNodeData extends BaseWorkflowNodeData {
  type: 'stop';
  reason?: string;
  status?: 'idle' | 'stopped';
}

/**
 * Union type for all workflow node data
 */
export type WorkflowNodeData = 
  | TextNodeData 
  | StructuredDataNodeData 
  | ConditionalNodeData 
  | StopNodeData;

/**
 * Workflow node type
 */
export type WorkflowNode = ReactFlowNode<WorkflowNodeData>;

/**
 * Workflow edge type
 */
export type WorkflowEdge = ReactFlowEdge;

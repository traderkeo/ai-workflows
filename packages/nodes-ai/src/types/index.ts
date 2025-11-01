import type { Node, Edge } from '@xyflow/react';
import type { z } from 'zod';

// ============================================================================
// Node Status
// ============================================================================

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'warning';

// ============================================================================
// Node Types
// ============================================================================

export type AINodeType =
  | 'input'
  | 'output'
  | 'text-generation'
  | 'structured-data'
  | 'tool-calling'
  | 'embedding'
  | 'semantic-search'
  | 'transform'
  | 'conditional'
  | 'parallel'
  | 'retry';

// ============================================================================
// Base Node Data
// ============================================================================

export interface BaseNodeData {
  label: string;
  status?: NodeStatus;
  error?: string;
  description?: string;
  executionTime?: number;
  [key: string]: any; // Allow additional properties
}

// ============================================================================
// Specific Node Data Types
// ============================================================================

export interface InputNodeData extends BaseNodeData {
  value: any;
  valueType: 'string' | 'number' | 'object' | 'array';
}

export interface OutputNodeData extends BaseNodeData {
  value: any;
}

export interface TextGenerationNodeData extends BaseNodeData {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  result?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StructuredDataNodeData extends BaseNodeData {
  prompt: string;
  schema?: z.ZodType;
  schemaName?: string;
  schemaDescription?: string;
  model?: string;
  temperature?: number;
  result?: any;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ToolCallingNodeData extends BaseNodeData {
  prompt: string;
  tools: string[]; // Tool names: 'search', 'calculator', 'dateTime'
  model?: string;
  temperature?: number;
  maxSteps?: number;
  result?: string;
  toolCalls?: Array<{
    toolName: string;
    args: any;
    result: any;
  }>;
}

export interface EmbeddingNodeData extends BaseNodeData {
  text: string;
  model?: string;
  dimensions?: number;
  result?: number[];
}

export interface SemanticSearchNodeData extends BaseNodeData {
  query: string;
  documents: Array<{
    text: string;
    embedding?: number[];
    [key: string]: any;
  }>;
  topK?: number;
  model?: string;
  results?: Array<{
    text: string;
    similarity: number;
    [key: string]: any;
  }>;
}

export interface TransformNodeData extends BaseNodeData {
  transformCode: string; // JavaScript code to transform input
  result?: any;
}

export interface ConditionalNodeData extends BaseNodeData {
  conditionCode: string; // JavaScript code returning boolean
  result?: boolean;
}

export interface ParallelNodeData extends BaseNodeData {
  results?: any[];
}

export interface RetryNodeData extends BaseNodeData {
  maxRetries: number;
  initialDelay: number;
  attempts?: number;
}

// ============================================================================
// Node Data Union Type
// ============================================================================

export type AINodeData =
  | InputNodeData
  | OutputNodeData
  | TextGenerationNodeData
  | StructuredDataNodeData
  | ToolCallingNodeData
  | EmbeddingNodeData
  | SemanticSearchNodeData
  | TransformNodeData
  | ConditionalNodeData
  | ParallelNodeData
  | RetryNodeData;

// ============================================================================
// Typed Nodes & Edges
// ============================================================================

export type AINode = Node<AINodeData>;
export type AIEdge = Edge;

// ============================================================================
// Flow State
// ============================================================================

export interface FlowState {
  nodes: AINode[];
  edges: AIEdge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

// ============================================================================
// Execution Context
// ============================================================================

export interface ExecutionContext {
  nodeResults: Map<string, any>;
  errors: Map<string, Error>;
  startTime: number;
  abortSignal?: AbortSignal;
}

// ============================================================================
// Workflow Metadata
// ============================================================================

export interface WorkflowMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  version: string;
}

// ============================================================================
// Saved Workflow
// ============================================================================

export interface SavedWorkflow {
  metadata: WorkflowMetadata;
  flow: FlowState;
}

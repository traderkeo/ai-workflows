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
  | 'start'
  | 'stop'
  | 'ai-agent'
  | 'text-generation'
  | 'structured-data'
  | 'tool-calling'
  | 'embedding'
  | 'semantic-search'
  | 'transform'
  | 'merge'
  | 'condition'
  | 'template'
  | 'conditional'
  | 'parallel'
  | 'retry'
  | 'http-request'
  | 'loop'
  | 'file-upload';

// ============================================================================
// Base Node Data
// ============================================================================

export interface BaseNodeData {
  label: string;
  name?: string; // Custom name for the node (used as variable reference)
  isCollapsed?: boolean; // Whether the node is collapsed
  status?: NodeStatus;
  error?: string;
  description?: string;
  executionTime?: number;
  [key: string]: any; // Allow additional properties
}

// ============================================================================
// Specific Node Data Types
// ============================================================================

export interface StartNodeData extends BaseNodeData {
  value: any;
  valueType: 'string' | 'number' | 'object' | 'array';
}

export interface StopNodeData extends BaseNodeData {
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
  schemaFields?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
  }>;
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

export interface AIAgentNodeData extends BaseNodeData {
  mode: 'text' | 'structured' | 'image' | 'image-edit' | 'image-variation' | 'audio' | 'speech';
  prompt: string;
  instructions?: string; // System prompt / instructions
  model?: string;
  temperature?: number;
  maxTokens?: number;
  // Text generation fields
  streamingText?: string;
  isStreaming?: boolean;
  // Structured data fields
  schema?: z.ZodType;
  schemaFields?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
  }>;
  schemaName?: string;
  schemaDescription?: string;
  // Image operation type
  imageOperation?: 'generate' | 'edit' | 'variation';
  // Source image for edit/variation operations
  imageSource?: string; // Base64 data URI or variable reference like {{ai-agent-3.image}}
  imageMask?: string; // Base64 data URI for mask (edit only)
  // Image generation fields (for /v1/images/generations)
  imageSize?: '256x256' | '512x512' | '1024x1024' | '1536x1024' | '1024x1536' | '1792x1024' | 'auto';
  imageQuality?: 'standard' | 'hd' | 'high' | 'medium' | 'low' | 'auto';
  imageStyle?: 'natural' | 'vivid';
  imageResponseFormat?: 'url' | 'b64_json'; // DALL-E 2/3 only (gpt-image-1 always uses b64)
  imageBackground?: 'transparent' | 'opaque' | 'auto' | string; // gpt-image-1 only (string for custom color)
  imageModeration?: 'low' | 'auto'; // gpt-image-1 only
  imageOutputFormat?: 'png' | 'jpeg' | 'webp'; // gpt-image-1 only
  imageOutputCompression?: number; // 0-100, gpt-image-1 only
  imageNumImages?: number; // 1-10 (dall-e-3 only supports 1)
  imageStream?: boolean; // gpt-image-1 only
  imagePartialImages?: number; // 0-3, gpt-image-1 only
  // Image edit fields (for /v1/images/edits)
  imageEditFidelity?: 'high' | 'low'; // gpt-image-1 only
  // Speech generation fields
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speechSpeed?: number; // 0.25 to 4.0
  // Audio fields
  audioTranscription?: string;
  // File attachments
  attachments?: Array<{
    type: 'image' | 'pdf' | 'audio';
    url: string;
    name?: string;
  }>;
  // Common fields
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

export interface HttpRequestNodeData extends BaseNodeData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  result?: {
    status: number;
    data: any;
    headers: Record<string, string>;
  };
}

export interface LoopNodeData extends BaseNodeData {
  loopType: 'count' | 'array' | 'condition';
  count?: number;
  array?: any[];
  conditionCode?: string;
  currentIteration?: number;
  results?: any[];
}

// ============================================================================
// Node Data Union Type
// ============================================================================

export type AINodeData =
  | StartNodeData
  | StopNodeData
  | AIAgentNodeData
  | TextGenerationNodeData
  | StructuredDataNodeData
  | ToolCallingNodeData
  | EmbeddingNodeData
  | SemanticSearchNodeData
  | TransformNodeData
  | ConditionalNodeData
  | ParallelNodeData
  | RetryNodeData
  | HttpRequestNodeData
  | LoopNodeData;

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
  tags?: string[];
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

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
  | 'generate'
  | 'image-generation'
  | 'audio-tts'
  | 'video-generation'
  | 'rerank'
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
  | 'file-upload'
  | 'splitter'
  | 'aggregator'
  | 'cache'
  | 'guardrail'
  | 'web-scrape'
  | 'web-search'
  | 'document-ingest'
  | 'retrieval-qa';

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

// (Removed) TextGenerationNodeData and StructuredDataNodeData in favor of GenerateNodeData

export interface GenerateNodeData extends BaseNodeData {
  mode: 'text' | 'structured';
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  // Structured
  schemaFields?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
  }>;
  schemaName?: string;
  schemaDescription?: string;
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
  // Agent v6 additions
  messages?: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string }>;
  tools?: { calculator?: boolean; search?: boolean; dateTime?: boolean };
  customTools?: Array<{
    name: string;
    description?: string;
    parametersJson?: string; // JSON Schema-like definition string
    endpointUrl?: string; // optional webhook endpoint for server-side execution
    method?: 'GET' | 'POST';
  }>;
  appendAssistantToHistory?: boolean;
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
  // Together image generation fields
  imageSteps?: number; // steps 1-50
  imageSeed?: number; // seed
  imageNegativePrompt?: string; // negative_prompt
  imageAspectRatio?: string; // e.g., '16:9', model dependent
  imageReferenceUrl?: string; // image_url for Kontext/Depth, etc.
  imageDisableSafetyChecker?: boolean; // disable_safety_checker
  imageLorasJson?: string; // JSON array for image_loras
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

export interface ImageGenerationNodeData extends BaseNodeData {
  operation: 'generate' | 'edit' | 'variation';
  prompt?: string;
  model?: string; // includes Together model ids
  // Common
  size?: string;
  n?: number;
  // OpenAI extras
  quality?: 'standard' | 'hd';
  style?: 'natural' | 'vivid';
  responseFormat?: 'b64_json' | 'url';
  // Together extras
  steps?: number;
  seed?: number;
  negativePrompt?: string;
  aspectRatio?: string;
  referenceUrl?: string;
  disableSafetyChecker?: boolean;
  imageLorasJson?: string;
  // Edit/variation sources
  sourceImage?: string;
  maskImage?: string;
  result?: { type: 'image'; image?: string; format?: string; revisedPrompt?: string; loading?: boolean };
}

export interface AudioTTSNodeData extends BaseNodeData {
  text: string;
  model?: string; // tts-1 default
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number;
  instructions?: string;
  result?: { type: 'audio'; audio?: string; format?: string; loading?: boolean };
}

export interface VideoGenerationNodeData extends BaseNodeData {
  prompt?: string;
  model?: string;
  note?: string;
}

export interface RerankNodeData extends BaseNodeData {
  query: string;
  candidates: string; // newline separated
  topK?: number;
  model?: string;
  result?: any;
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

// ----------------------------------------------------------------------------
// Phase 1 utility nodes
// ----------------------------------------------------------------------------

export interface SplitterNodeData extends BaseNodeData {
  input?: string; // templated
  strategy: 'length' | 'lines' | 'sentences' | 'regex';
  chunkSize?: number; // for length strategy (characters)
  overlap?: number; // for length strategy
  regexPattern?: string; // for regex strategy
  regexFlags?: string;
  result?: string[];
}

export interface AggregatorNodeData extends BaseNodeData {
  items?: string; // templated; expects array JSON or delimited
  mode: 'concat-text' | 'merge-objects' | 'flatten-array';
  delimiter?: string; // for concat
  result?: any;
}

export interface CacheNodeData extends BaseNodeData {
  keyTemplate: string; // templated
  valueTemplate?: string; // templated (optional when reading)
  operation: 'get' | 'set';
  writeIfMiss?: boolean; // when get misses, set from valueTemplate
  hit?: boolean;
  value?: any;
}

export interface GuardrailNodeData extends BaseNodeData {
  input?: string; // templated text or JSON string
  checks: {
    blocklist?: boolean;
    pii?: boolean;
    toxicity?: boolean; // placeholder; simple heuristic only
    regex?: boolean;
  };
  blocklistWords?: string; // comma-separated
  regexPatterns?: string; // one per line
  result?: {
    passed: boolean;
    violations: Array<{ type: string; detail: string }>;
  };
}

export interface WebScrapeNodeData extends BaseNodeData {
  url?: string; // templated
  extractText?: boolean;
  result?: {
    status: number;
    title?: string;
    content?: string;
    html?: string;
    error?: string;
  };
}

// ----------------------------------------------------------------------------
// Phase 2 RAG nodes
// ----------------------------------------------------------------------------

export interface DocumentIngestNodeData extends BaseNodeData {
  sourceType: 'text' | 'url';
  textTemplate?: string; // templated text
  url?: string; // templated URL
  extractText?: boolean; // for URL mode (client can parse)
  split?: boolean;
  chunkSize?: number;
  overlap?: number;
  embed?: boolean;
  embeddingModel?: string; // e.g., text-embedding-3-small
  embeddingDimensions?: number | null;
  result?: {
    documents: string[];
    chunks?: string[];
    embeddings?: number[][]; // parallel to chunks or documents
  };
}

export interface RetrievalQANodeData extends BaseNodeData {
  queryTemplate: string; // templated
  topK?: number;
  model?: string;
  temperature?: number;
  answer?: string;
  citations?: Array<{ index: number; snippet: string }>;
  result?: {
    answer: string;
    citations: Array<{ index: number; snippet: string }>;
  };
}

// ============================================================================
// Node Data Union Type
// ============================================================================

export type AINodeData =
  | StartNodeData
  | StopNodeData
  | GenerateNodeData
  | AIAgentNodeData
  | ImageGenerationNodeData
  | AudioTTSNodeData
  | VideoGenerationNodeData
  | RerankNodeData
  | ToolCallingNodeData
  | EmbeddingNodeData
  | SemanticSearchNodeData
  | TransformNodeData
  | ConditionalNodeData
  | ParallelNodeData
  | RetryNodeData
  | HttpRequestNodeData
  | LoopNodeData
  | SplitterNodeData
  | AggregatorNodeData
  | CacheNodeData
  | GuardrailNodeData
  | WebScrapeNodeData
  | DocumentIngestNodeData
  | RetrievalQANodeData;

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

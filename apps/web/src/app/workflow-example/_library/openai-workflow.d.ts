/**
 * TypeScript definitions for OpenAI Workflow Library
 */

import type { z } from 'zod';
import type { Tool } from 'ai';

// ============================================================================
// Context
// ============================================================================

export class WorkflowContext {
  constructor();
  set(key: string, value: any): void;
  get(key: string): any;
  has(key: string): boolean;
  getHistory(): Array<{ key: string; value: any; timestamp: number }>;
  incrementNodeExecutions(): void;
  addTokenUsage(tokens: number): void;
  getMetadata(): {
    nodeExecutions: number;
    totalTokens: number;
    duration: number;
    startTime: number;
  };
}

// ============================================================================
// Common Types
// ============================================================================

export interface BaseResult {
  success: boolean;
  metadata: {
    model?: string;
    timestamp: number;
    errorType?: string;
    [key: string]: any;
  };
}

export interface UsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  [key: string]: any;
}

// ============================================================================
// Text Generation
// ============================================================================

export interface GenerateTextParams {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  messages?: Message[];
  context?: WorkflowContext;
  abortSignal?: AbortSignal;
}

export interface GenerateTextResult extends BaseResult {
  text: string | null;
  usage?: UsageMetrics;
  finishReason?: string;
  messages?: Message[];
  error?: string;
}

export function generateTextNode(params: GenerateTextParams): Promise<GenerateTextResult>;

// ============================================================================
// Streaming Text
// ============================================================================

export interface StreamTextParams {
  prompt: string;
  onChunk: (chunk: string, fullText: string) => void;
  onFinish?: (result: {
    text: string;
    usage?: UsageMetrics;
    finishReason?: string;
  }) => void;
  onError?: (error: Error) => void;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  messages?: Message[];
  context?: WorkflowContext;
  abortSignal?: AbortSignal;
}

export interface StreamTextResult extends BaseResult {
  text: string;
  stream?: any;
  error?: string;
}

export function streamTextNode(params: StreamTextParams): Promise<StreamTextResult>;

// ============================================================================
// Structured Data
// ============================================================================

export interface GenerateStructuredDataParams<T extends z.ZodType> {
  prompt: string;
  schema: T;
  schemaName?: string;
  schemaDescription?: string;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  context?: WorkflowContext;
  abortSignal?: AbortSignal;
}

export interface GenerateStructuredDataResult<T> extends BaseResult {
  object: T | null;
  usage?: UsageMetrics;
  finishReason?: string;
  error?: string;
}

export function generateStructuredDataNode<T extends z.ZodType>(
  params: GenerateStructuredDataParams<T>
): Promise<GenerateStructuredDataResult<z.infer<T>>>;

// ============================================================================
// Tool Calling
// ============================================================================

export interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: any;
}

export interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: any;
}

export interface StepFinishEvent {
  text?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  stepType: string;
  usage?: UsageMetrics;
}

export interface GenerateWithToolsParams {
  prompt: string;
  tools: Record<string, Tool>;
  model?: string;
  temperature?: number;
  maxSteps?: number;
  systemPrompt?: string;
  messages?: Message[];
  onStepFinish?: (step: StepFinishEvent) => void;
  context?: WorkflowContext;
  abortSignal?: AbortSignal;
}

export interface GenerateWithToolsResult extends BaseResult {
  text: string | null;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  steps: any[];
  usage?: UsageMetrics;
  finishReason?: string;
  messages?: Message[];
  error?: string;
}

export function generateWithToolsNode(
  params: GenerateWithToolsParams
): Promise<GenerateWithToolsResult>;

// ============================================================================
// Embeddings
// ============================================================================

export interface GenerateEmbeddingParams {
  text: string;
  model?: string;
  dimensions?: number;
  context?: WorkflowContext;
  abortSignal?: AbortSignal;
}

export interface GenerateEmbeddingResult extends BaseResult {
  embedding: number[] | null;
  dimensions?: number;
  usage?: {
    tokens: number;
  };
  error?: string;
}

export function generateEmbeddingNode(
  params: GenerateEmbeddingParams
): Promise<GenerateEmbeddingResult>;

export interface GenerateEmbeddingsBatchParams {
  texts: string[];
  model?: string;
  dimensions?: number;
  maxParallelCalls?: number;
  context?: WorkflowContext;
  abortSignal?: AbortSignal;
}

export interface GenerateEmbeddingsBatchResult extends BaseResult {
  embeddings: number[][] | null;
  count?: number;
  dimensions?: number;
  usage?: {
    tokens: number;
  };
  error?: string;
}

export function generateEmbeddingsBatchNode(
  params: GenerateEmbeddingsBatchParams
): Promise<GenerateEmbeddingsBatchResult>;

export function cosineSimilarity(embedding1: number[], embedding2: number[]): number;

// ============================================================================
// Semantic Search
// ============================================================================

export interface Document {
  text: string;
  embedding: number[];
  [key: string]: any;
}

export interface SemanticSearchParams {
  query: string;
  documents: Document[];
  topK?: number;
  model?: string;
  context?: WorkflowContext;
}

export interface SearchResult extends Document {
  similarity: number;
}

export interface SemanticSearchResult extends BaseResult {
  query?: string;
  results: SearchResult[] | null;
  count?: number;
  error?: string;
}

export function semanticSearchNode(
  params: SemanticSearchParams
): Promise<SemanticSearchResult>;

// ============================================================================
// Pre-built Tools
// ============================================================================

export const searchTool: Tool;
export const calculatorTool: Tool;
export const dateTimeTool: Tool;

// ============================================================================
// Workflow Utilities
// ============================================================================

export type NodeFunction<TInput = any, TOutput = any> = (
  input: TInput,
  context: WorkflowContext
) => Promise<TOutput>;

export interface ChainNodesResult extends BaseResult {
  finalOutput: any;
  results: Array<{
    nodeIndex: number;
    result: any;
    timestamp: number;
  }>;
  error?: string;
}

export function chainNodes(
  nodes: NodeFunction[],
  initialInput: any,
  context?: WorkflowContext
): Promise<ChainNodesResult>;

export interface ParallelNodeConfig {
  node: NodeFunction;
  input: any;
}

export interface ParallelNodesResult extends BaseResult {
  results: any[];
}

export function parallelNodes(
  nodeConfigs: ParallelNodeConfig[],
  context?: WorkflowContext
): Promise<ParallelNodesResult>;

export type PredicateFunction = (input: any) => boolean | Promise<boolean>;

export interface ConditionalNodeResult extends BaseResult {
  branchTaken: 'true' | 'false';
}

export function conditionalNode(
  predicate: PredicateFunction,
  trueBranch: NodeFunction,
  falseBranch: NodeFunction,
  input: any,
  context?: WorkflowContext
): Promise<ConditionalNodeResult>;

export interface RetryNodeResult extends BaseResult {
  attempts: number;
  error?: string;
}

export function retryNode(
  node: NodeFunction,
  input: any,
  maxRetries?: number,
  initialDelay?: number,
  context?: WorkflowContext
): Promise<RetryNodeResult>;

// ============================================================================
// Default Export
// ============================================================================

declare const defaultExport: {
  WorkflowContext: typeof WorkflowContext;
  generateTextNode: typeof generateTextNode;
  streamTextNode: typeof streamTextNode;
  generateStructuredDataNode: typeof generateStructuredDataNode;
  generateWithToolsNode: typeof generateWithToolsNode;
  generateEmbeddingNode: typeof generateEmbeddingNode;
  generateEmbeddingsBatchNode: typeof generateEmbeddingsBatchNode;
  semanticSearchNode: typeof semanticSearchNode;
  cosineSimilarity: typeof cosineSimilarity;
  searchTool: typeof searchTool;
  calculatorTool: typeof calculatorTool;
  dateTimeTool: typeof dateTimeTool;
  chainNodes: typeof chainNodes;
  parallelNodes: typeof parallelNodes;
  conditionalNode: typeof conditionalNode;
  retryNode: typeof retryNode;
};

export default defaultExport;

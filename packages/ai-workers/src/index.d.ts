/**
 * TypeScript definitions for OpenAI Workflow Library
 */

import type { z } from 'zod';
import type { Tool } from 'ai';

// ============================================================================
// Model Types
// ============================================================================

/**
 * Supported AI model identifiers across all providers
 */
export type AIModel =
  // OpenAI Models
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  // Anthropic Models
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'
  // Google Models
  | 'gemini-2.0-flash-exp'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'gemini-1.5-flash-8b';

/**
 * Backward compatibility type alias
 */
export type OpenAIModel = AIModel;

/**
 * Model configuration with metadata
 */
export interface ModelInfo {
  id: string;
  provider: 'openai' | 'anthropic' | 'google';
  name: string;
  description: string;
  maxTokens: number;
  supportsVision?: boolean;
}

/**
 * Available models with metadata (all providers)
 */
export const SUPPORTED_MODELS: Record<string, ModelInfo>;

/**
 * OpenAI models only
 */
export const OPENAI_MODELS: Record<string, ModelInfo>;

/**
 * Anthropic (Claude) models only
 */
export const ANTHROPIC_MODELS: Record<string, ModelInfo>;

/**
 * Google (Gemini) models only
 */
export const GOOGLE_MODELS: Record<string, ModelInfo>;

/**
 * Get model information by ID
 */
export function getModelInfo(modelId: string): ModelInfo;

/**
 * Get provider model instance
 */
export function getProviderModel(modelId: string): any;

/**
 * Get all models grouped by provider
 */
export function getModelsByProvider(): {
  openai: ModelInfo[];
  anthropic: ModelInfo[];
  google: ModelInfo[];
};

/**
 * Get all model IDs
 */
export function getAllModelIds(): string[];

/**
 * Check if a model ID is valid
 */
export function isValidModel(modelId: string): boolean;

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
  model?: OpenAIModel | string;
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

export interface StreamStructuredDataParams<T extends z.ZodType> {
  prompt: string;
  schema: T;
  onPartial: (partialObject: Partial<z.infer<T>>) => void;
  onFinish?: (result: {
    object: z.infer<T>;
    usage?: UsageMetrics;
    finishReason?: string;
  }) => void;
  onError?: (error: Error) => void;
  schemaName?: string;
  schemaDescription?: string;
  model?: OpenAIModel | string;
  temperature?: number;
  systemPrompt?: string;
  context?: WorkflowContext;
  abortSignal?: AbortSignal;
}

export interface StreamStructuredDataResult<T> extends BaseResult {
  object: T | null;
  stream?: any;
  error?: string;
}

export function streamStructuredDataNode<T extends z.ZodType>(
  params: StreamStructuredDataParams<T>
): Promise<StreamStructuredDataResult<z.infer<T>>>;

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
// Web Search
// ============================================================================

export interface Citation {
  title: string;
  url: string;
  content?: string;
}

export interface WebSearchFilters {
  allowedDomains?: string[];
  blockedDomains?: string[];
  maxResults?: number;
  timeRange?: 'day' | 'week' | 'month' | 'year';
}

export interface UserLocation {
  country?: string;
  city?: string;
  region?: string;
}

export interface WebSearchParams {
  query: string;
  model?: OpenAIModel | string;
  filters?: WebSearchFilters;
  userLocation?: UserLocation;
  externalWebAccess?: boolean;
  includeSources?: boolean;
  reasoning?: { effort: 'low' | 'medium' | 'high' } | null;
  toolChoice?: 'auto' | 'required' | 'none';
  context?: WorkflowContext;
  abortSignal?: AbortSignal;
}

export interface WebSearchResult extends BaseResult {
  text: string | null;
  citations?: Citation[];
  sources?: string[];
  searchCalls?: any[];
  usage?: UsageMetrics;
  finishReason?: string;
  error?: string;
}

export function webSearchNode(params: WebSearchParams): Promise<WebSearchResult>;

export interface SimpleWebSearchOptions {
  model?: OpenAIModel | string;
  externalWebAccess?: boolean;
  includeSources?: boolean;
}

export function simpleWebSearch(
  query: string,
  options?: SimpleWebSearchOptions
): Promise<WebSearchResult>;

export interface DomainFilteredSearchParams {
  query: string;
  domains: string[];
  model?: OpenAIModel | string;
  externalWebAccess?: boolean;
  includeSources?: boolean;
}

export function domainFilteredSearch(
  params: DomainFilteredSearchParams
): Promise<WebSearchResult>;

export interface LocationAwareSearchParams {
  query: string;
  location: UserLocation;
  model?: OpenAIModel | string;
  externalWebAccess?: boolean;
  includeSources?: boolean;
}

export function locationAwareSearch(
  params: LocationAwareSearchParams
): Promise<WebSearchResult>;

export interface CachedWebSearchOptions extends SimpleWebSearchOptions {
  cacheKey?: string;
  cacheDuration?: number;
}

export function cachedWebSearch(
  query: string,
  options?: CachedWebSearchOptions
): Promise<WebSearchResult>;

export function webSearchWithSources(
  query: string,
  options?: SimpleWebSearchOptions
): Promise<WebSearchResult>;

export function formatCitations(citations: Citation[]): string;

export function extractDomains(urls: string[]): string[];

export function createMarkdownCitations(citations: Citation[]): string;

// ============================================================================
// Image Generation
// ============================================================================

export interface GenerateImageParams {
  prompt: string;
  model?: string; // dall-e-2, dall-e-3, gpt-image-1, gpt-image-1-mini
  size?: string; // dall-e-2: 256x256, 512x512, 1024x1024; dall-e-3/gpt-image: 1024x1024, 1792x1024, 1024x1792, auto
  quality?: 'standard' | 'hd' | 'high' | 'medium' | 'low' | 'auto';
  style?: 'natural' | 'vivid';
  response_format?: 'url' | 'b64_json'; // DALL-E 2/3 only (gpt-image-1 always uses b64)
  background?: 'transparent' | 'opaque' | 'auto'; // gpt-image-1 only
  moderation?: 'low' | 'auto'; // gpt-image-1 only
  output_format?: 'png' | 'jpeg' | 'webp'; // gpt-image-1 only
  output_compression?: number; // 0-100, gpt-image-1 only
  n?: number; // 1-10 (dall-e-3 only supports 1)
  stream?: boolean; // gpt-image-1 only
  partial_images?: number; // 0-3, gpt-image-1 only
  context?: WorkflowContext;
  abortSignal?: AbortSignal;
}

export interface GenerateImageResult extends BaseResult {
  image: string | null; // URL or base64
  format?: 'url' | 'base64';
  revisedPrompt?: string;
  error?: string;
}

export function generateImageNode(params: GenerateImageParams): Promise<GenerateImageResult>;

export interface EditImageParams {
  prompt: string;
  image: string; // Base64 data URI or URL
  mask?: string; // Optional base64 data URI or URL
  model?: string; // dall-e-2 only
  size?: string; // 256x256, 512x512, 1024x1024
  n?: number; // 1-10
  response_format?: 'url' | 'b64_json';
  context?: WorkflowContext;
  abortSignal?: AbortSignal;
}

export interface EditImageResult extends BaseResult {
  image: string | null; // URL or base64
  format?: 'url' | 'base64';
  error?: string;
}

export function editImageNode(params: EditImageParams): Promise<EditImageResult>;

export interface CreateImageVariationParams {
  image: string; // Base64 data URI or URL
  model?: string; // dall-e-2 only
  size?: string; // 256x256, 512x512, 1024x1024
  n?: number; // 1-10
  response_format?: 'url' | 'b64_json';
  context?: WorkflowContext;
  abortSignal?: AbortSignal;
}

export interface CreateImageVariationResult extends BaseResult {
  image: string | null; // URL or base64
  format?: 'url' | 'base64';
  error?: string;
}

export function createImageVariationNode(params: CreateImageVariationParams): Promise<CreateImageVariationResult>;

// ============================================================================
// Speech Generation
// ============================================================================

export interface GenerateSpeechParams {
  text: string;
  model?: string; // tts-1, tts-1-hd, gpt-4o-mini-tts
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number; // 0.25 to 4.0
  responseFormat?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';
  instructions?: string;
  context?: WorkflowContext;
  abortSignal?: AbortSignal;
}

export interface GenerateSpeechResult extends BaseResult {
  audio: string | null; // base64 encoded audio
  format?: string;
  error?: string;
}

export function generateSpeechNode(params: GenerateSpeechParams): Promise<GenerateSpeechResult>;

// ============================================================================
// Audio Transcription
// ============================================================================

export interface TranscribeAudioParams {
  audio: Buffer | Uint8Array;
  model?: string; // whisper-1, gpt-4o-mini-transcribe, gpt-4o-transcribe
  language?: string; // ISO-639-1 format (e.g., 'en')
  prompt?: string;
  temperature?: number;
  timestampGranularities?: string[]; // ['word'], ['segment'], or both
  context?: WorkflowContext;
  abortSignal?: AbortSignal;
}

export interface TranscribeAudioResult extends BaseResult {
  text: string | null;
  language?: string;
  duration?: number;
  segments?: Array<{
    text: string;
    startSecond: number;
    endSecond: number;
  }>;
  words?: Array<{
    word: string;
    startSecond: number;
    endSecond: number;
  }>;
  error?: string;
}

export function transcribeAudioNode(params: TranscribeAudioParams): Promise<TranscribeAudioResult>;

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
  generateImageNode: typeof generateImageNode;
  generateSpeechNode: typeof generateSpeechNode;
  transcribeAudioNode: typeof transcribeAudioNode;
  searchTool: typeof searchTool;
  calculatorTool: typeof calculatorTool;
  dateTimeTool: typeof dateTimeTool;
  chainNodes: typeof chainNodes;
  parallelNodes: typeof parallelNodes;
  conditionalNode: typeof conditionalNode;
  retryNode: typeof retryNode;
};

export default defaultExport;

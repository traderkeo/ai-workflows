/**
 * OpenAI Workflow Library
 *
 * A comprehensive library for building visual node-based AI workflows
 * using the Vercel AI SDK. Supports text generation, streaming, tool calling,
 * embeddings, and structured data extraction.
 *
 * @module openai-workflow
 */

import { generateText, streamText, generateObject, embed, embedMany, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { getProviderModel, SUPPORTED_MODELS, getModelInfo } from './providers.mjs';

// ============================================================================
// Model Configuration
// ============================================================================

// Export models and utilities from providers
export { SUPPORTED_MODELS, getModelInfo };

// ============================================================================
// Configuration & Types
// ============================================================================

/**
 * Workflow execution context passed between nodes
 */
export class WorkflowContext {
  constructor() {
    this.data = new Map();
    this.history = [];
    this.metadata = {
      startTime: Date.now(),
      nodeExecutions: 0,
      totalTokens: 0,
    };
  }

  set(key, value) {
    this.data.set(key, value);
    this.history.push({ key, value, timestamp: Date.now() });
  }

  get(key) {
    return this.data.get(key);
  }

  has(key) {
    return this.data.has(key);
  }

  getHistory() {
    return this.history;
  }

  incrementNodeExecutions() {
    this.metadata.nodeExecutions++;
  }

  addTokenUsage(tokens) {
    this.metadata.totalTokens += tokens;
  }

  getMetadata() {
    return {
      ...this.metadata,
      duration: Date.now() - this.metadata.startTime,
    };
  }
}

/**
 * Base configuration for all workflow nodes
 */
const DEFAULT_CONFIG = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2048,
  maxRetries: 2,
  timeout: 30000, // 30 seconds
};

// ============================================================================
// Text Generation Nodes
// ============================================================================

/**
 * Generate text using OpenAI models
 * Suitable for general-purpose text generation tasks
 *
 * @param {Object} params - Generation parameters
 * @param {string} params.prompt - The prompt to generate text from
 * @param {string} [params.model] - Model to use (default: gpt-4o-mini)
 * @param {number} [params.temperature] - Sampling temperature (0-2)
 * @param {number} [params.maxTokens] - Maximum tokens to generate
 * @param {string} [params.systemPrompt] - System message for model behavior
 * @param {Array} [params.messages] - Previous conversation messages
 * @param {WorkflowContext} [params.context] - Workflow context
 * @returns {Promise<Object>} Generated text and metadata
 */
export async function generateTextNode({
  prompt,
  model = DEFAULT_CONFIG.model,
  temperature = DEFAULT_CONFIG.temperature,
  maxTokens = DEFAULT_CONFIG.maxTokens,
  systemPrompt = '',
  messages = [],
  context = null,
  abortSignal = null,
}) {
  try {
    const modelInstance = getProviderModel(model);

    const messagesArray = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
      { role: 'user', content: prompt },
    ];

    const result = await generateText({
      model: modelInstance,
      messages: messagesArray,
      temperature,
      maxTokens,
      maxRetries: DEFAULT_CONFIG.maxRetries,
      abortSignal,
    });

    // Update context if provided
    if (context) {
      context.incrementNodeExecutions();
      context.addTokenUsage(result.usage?.totalTokens || 0);
    }

    return {
      success: true,
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
      messages: result.response?.messages || [],
      metadata: {
        model,
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      text: null,
      metadata: {
        model,
        timestamp: Date.now(),
        errorType: error.constructor.name,
      },
    };
  }
}

/**
 * Stream text generation with real-time updates
 * Perfect for chat interfaces and progressive display
 *
 * @param {Object} params - Streaming parameters
 * @param {string} params.prompt - The prompt to generate text from
 * @param {Function} params.onChunk - Callback for each text chunk
 * @param {Function} [params.onFinish] - Callback when generation completes
 * @param {Function} [params.onError] - Callback for errors
 * @param {string} [params.model] - Model to use
 * @param {number} [params.temperature] - Sampling temperature
 * @param {number} [params.maxTokens] - Maximum tokens to generate
 * @param {string} [params.systemPrompt] - System message
 * @param {Array} [params.messages] - Previous messages
 * @param {WorkflowContext} [params.context] - Workflow context
 * @returns {Promise<Object>} Stream control object
 */
export async function streamTextNode({
  prompt,
  onChunk,
  onFinish = null,
  onError = null,
  model = DEFAULT_CONFIG.model,
  temperature = DEFAULT_CONFIG.temperature,
  maxTokens = DEFAULT_CONFIG.maxTokens,
  systemPrompt = '',
  messages = [],
  context = null,
  abortSignal = null,
}) {
  try {
    const modelInstance = getProviderModel(model);

    const messagesArray = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
      { role: 'user', content: prompt },
    ];

    const result = await streamText({
      model: modelInstance,
      messages: messagesArray,
      temperature,
      maxTokens,
      maxRetries: DEFAULT_CONFIG.maxRetries,
      abortSignal,
      onFinish: (event) => {
        if (context) {
          context.incrementNodeExecutions();
          context.addTokenUsage(event.usage?.totalTokens || 0);
        }
        if (onFinish) {
          onFinish({
            text: event.text,
            usage: event.usage,
            finishReason: event.finishReason,
          });
        }
      },
    });

    // Process the stream
    let fullText = '';
    for await (const textPart of result.textStream) {
      fullText += textPart;
      if (onChunk) {
        onChunk(textPart, fullText);
      }
    }

    return {
      success: true,
      text: fullText,
      stream: result,
      metadata: {
        model,
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    if (onError) {
      onError(error);
    }
    return {
      success: false,
      error: error.message,
      text: null,
      metadata: {
        model,
        timestamp: Date.now(),
        errorType: error.constructor.name,
      },
    };
  }
}

// ============================================================================
// Structured Data Generation
// ============================================================================

/**
 * Generate structured data that conforms to a schema
 * Useful for data extraction, form filling, and API responses
 *
 * @param {Object} params - Generation parameters
 * @param {string} params.prompt - The prompt for data generation
 * @param {Object} params.schema - Zod schema defining the output structure
 * @param {string} [params.schemaName] - Name for the schema (default: 'response')
 * @param {string} [params.schemaDescription] - Description of the schema
 * @param {string} [params.model] - Model to use
 * @param {number} [params.temperature] - Sampling temperature
 * @param {string} [params.systemPrompt] - System message
 * @param {WorkflowContext} [params.context] - Workflow context
 * @returns {Promise<Object>} Structured object and metadata
 */
export async function generateStructuredDataNode({
  prompt,
  schema,
  schemaName = 'response',
  schemaDescription = 'Structured response',
  model = DEFAULT_CONFIG.model,
  temperature = DEFAULT_CONFIG.temperature,
  systemPrompt = '',
  context = null,
  abortSignal = null,
}) {
  try {
    const modelInstance = getProviderModel(model);

    const result = await generateObject({
      model: modelInstance,
      schema,
      schemaName,
      schemaDescription,
      prompt,
      system: systemPrompt,
      temperature,
      maxRetries: DEFAULT_CONFIG.maxRetries,
      abortSignal,
    });

    if (context) {
      context.incrementNodeExecutions();
      context.addTokenUsage(result.usage?.totalTokens || 0);
    }

    return {
      success: true,
      object: result.object,
      usage: result.usage,
      finishReason: result.finishReason,
      metadata: {
        model,
        schemaName,
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      object: null,
      metadata: {
        model,
        schemaName,
        timestamp: Date.now(),
        errorType: error.constructor.name,
      },
    };
  }
}

/**
 * Stream structured data generation with partial object updates
 * Perfect for progressive display of form data or structured content
 *
 * @param {Object} params - Streaming parameters
 * @param {string} params.prompt - The prompt for data generation
 * @param {Object} params.schema - Zod schema defining the output structure
 * @param {Function} params.onPartial - Callback for partial object updates
 * @param {Function} [params.onFinish] - Callback when generation completes
 * @param {Function} [params.onError] - Callback for errors
 * @param {string} [params.schemaName] - Name for the schema
 * @param {string} [params.schemaDescription] - Description of the schema
 * @param {string} [params.model] - Model to use
 * @param {number} [params.temperature] - Sampling temperature
 * @param {string} [params.systemPrompt] - System message
 * @param {WorkflowContext} [params.context] - Workflow context
 * @returns {Promise<Object>} Final object and metadata
 */
export async function streamStructuredDataNode({
  prompt,
  schema,
  onPartial,
  onFinish = null,
  onError = null,
  schemaName = 'response',
  schemaDescription = 'Structured response',
  model = DEFAULT_CONFIG.model,
  temperature = DEFAULT_CONFIG.temperature,
  systemPrompt = '',
  context = null,
  abortSignal = null,
}) {
  try {
    const { streamObject } = await import('ai');
    const modelInstance = getProviderModel(model);

    const result = await streamObject({
      model: modelInstance,
      schema,
      schemaName,
      schemaDescription,
      prompt,
      system: systemPrompt,
      temperature,
      maxRetries: DEFAULT_CONFIG.maxRetries,
      abortSignal,
      onFinish: (event) => {
        if (context) {
          context.incrementNodeExecutions();
          context.addTokenUsage(event.usage?.totalTokens || 0);
        }
        if (onFinish) {
          onFinish({
            object: event.object,
            usage: event.usage,
            finishReason: event.finishReason,
          });
        }
      },
    });

    // Process the stream
    for await (const partialObject of result.partialObjectStream) {
      if (onPartial) {
        onPartial(partialObject);
      }
    }

    const finalObject = await result.object;

    return {
      success: true,
      object: finalObject,
      stream: result,
      metadata: {
        model,
        schemaName,
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    if (onError) {
      onError(error);
    }
    return {
      success: false,
      error: error.message,
      object: null,
      metadata: {
        model,
        schemaName,
        timestamp: Date.now(),
        errorType: error.constructor.name,
      },
    };
  }
}

// ============================================================================
// Tool Calling / Function Calling
// ============================================================================

/**
 * Execute text generation with tool/function calling support
 * Allows the model to call external functions and use results
 *
 * @param {Object} params - Generation parameters
 * @param {string} params.prompt - The prompt
 * @param {Object} params.tools - Tool definitions { toolName: toolDefinition }
 * @param {string} [params.model] - Model to use
 * @param {number} [params.temperature] - Sampling temperature
 * @param {number} [params.maxSteps] - Maximum tool call steps (default: 5)
 * @param {string} [params.systemPrompt] - System message
 * @param {Array} [params.messages] - Previous messages
 * @param {Function} [params.onStepFinish] - Callback after each step
 * @param {WorkflowContext} [params.context] - Workflow context
 * @returns {Promise<Object>} Result with tool calls and final text
 */
export async function generateWithToolsNode({
  prompt,
  tools,
  model = DEFAULT_CONFIG.model,
  temperature = DEFAULT_CONFIG.temperature,
  maxSteps = 5,
  systemPrompt = '',
  messages = [],
  onStepFinish = null,
  context = null,
  abortSignal = null,
}) {
  try {
    const modelInstance = getProviderModel(model);

    const messagesArray = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
      { role: 'user', content: prompt },
    ];

    const result = await generateText({
      model: modelInstance,
      messages: messagesArray,
      tools,
      temperature,
      maxSteps,
      maxRetries: DEFAULT_CONFIG.maxRetries,
      abortSignal,
      onStepFinish: (event) => {
        if (onStepFinish) {
          onStepFinish({
            text: event.text,
            toolCalls: event.toolCalls,
            toolResults: event.toolResults,
            stepType: event.stepType,
            usage: event.usage,
          });
        }
      },
    });

    if (context) {
      context.incrementNodeExecutions();
      context.addTokenUsage(result.usage?.totalTokens || 0);
    }

    return {
      success: true,
      text: result.text,
      toolCalls: result.toolCalls || [],
      toolResults: result.toolResults || [],
      steps: result.steps || [],
      usage: result.usage,
      finishReason: result.finishReason,
      messages: result.response?.messages || [],
      metadata: {
        model,
        timestamp: Date.now(),
        stepCount: result.steps?.length || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      text: null,
      toolCalls: [],
      toolResults: [],
      metadata: {
        model,
        timestamp: Date.now(),
        errorType: error.constructor.name,
      },
    };
  }
}

// ============================================================================
// Embeddings
// ============================================================================

/**
 * Generate embedding vector for a single text value
 * Useful for semantic search, similarity matching, and clustering
 *
 * @param {Object} params - Embedding parameters
 * @param {string} params.text - Text to embed
 * @param {string} [params.model] - Embedding model (default: text-embedding-3-small)
 * @param {number} [params.dimensions] - Output dimensions (optional)
 * @param {WorkflowContext} [params.context] - Workflow context
 * @returns {Promise<Object>} Embedding vector and metadata
 */
export async function generateEmbeddingNode({
  text,
  model = 'text-embedding-3-small',
  dimensions = null,
  context = null,
  abortSignal = null,
}) {
  try {
    const modelInstance = openai.textEmbeddingModel(model);

    const providerOptions = dimensions ? { dimensions } : {};

    const result = await embed({
      model: modelInstance,
      value: text,
      providerOptions,
      maxRetries: DEFAULT_CONFIG.maxRetries,
      abortSignal,
    });

    if (context) {
      context.incrementNodeExecutions();
      context.addTokenUsage(result.usage?.tokens || 0);
    }

    return {
      success: true,
      embedding: result.embedding,
      dimensions: result.embedding.length,
      usage: result.usage,
      metadata: {
        model,
        timestamp: Date.now(),
        textLength: text.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      embedding: null,
      metadata: {
        model,
        timestamp: Date.now(),
        errorType: error.constructor.name,
      },
    };
  }
}

/**
 * Generate embeddings for multiple text values in batch
 * More efficient than calling generateEmbedding multiple times
 *
 * @param {Object} params - Batch embedding parameters
 * @param {Array<string>} params.texts - Array of texts to embed
 * @param {string} [params.model] - Embedding model
 * @param {number} [params.dimensions] - Output dimensions
 * @param {number} [params.maxParallelCalls] - Max parallel API calls
 * @param {WorkflowContext} [params.context] - Workflow context
 * @returns {Promise<Object>} Array of embeddings and metadata
 */
export async function generateEmbeddingsBatchNode({
  texts,
  model = 'text-embedding-3-small',
  dimensions = null,
  maxParallelCalls = 5,
  context = null,
  abortSignal = null,
}) {
  try {
    const modelInstance = openai.textEmbeddingModel(model);

    const providerOptions = dimensions ? { dimensions } : {};

    const result = await embedMany({
      model: modelInstance,
      values: texts,
      providerOptions,
      maxParallelCalls,
      maxRetries: DEFAULT_CONFIG.maxRetries,
      abortSignal,
    });

    if (context) {
      context.incrementNodeExecutions();
      context.addTokenUsage(result.usage?.tokens || 0);
    }

    return {
      success: true,
      embeddings: result.embeddings,
      count: result.embeddings.length,
      dimensions: result.embeddings[0]?.length || 0,
      usage: result.usage,
      metadata: {
        model,
        timestamp: Date.now(),
        batchSize: texts.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      embeddings: null,
      metadata: {
        model,
        timestamp: Date.now(),
        errorType: error.constructor.name,
      },
    };
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns a value between -1 and 1 (higher = more similar)
 *
 * @param {Array<number>} embedding1 - First embedding vector
 * @param {Array<number>} embedding2 - Second embedding vector
 * @returns {number} Cosine similarity score
 */
export function cosineSimilarity(embedding1, embedding2) {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimensions');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Find most similar texts to a query using embeddings
 *
 * @param {Object} params - Search parameters
 * @param {string} params.query - Query text
 * @param {Array<{text: string, embedding: Array<number>}>} params.documents - Documents with pre-computed embeddings
 * @param {number} [params.topK] - Number of results to return
 * @param {string} [params.model] - Embedding model for query
 * @returns {Promise<Object>} Ranked similar documents
 */
export async function semanticSearchNode({
  query,
  documents,
  topK = 5,
  model = 'text-embedding-3-small',
  context = null,
}) {
  try {
    // Generate embedding for query
    const queryResult = await generateEmbeddingNode({ text: query, model, context });

    if (!queryResult.success) {
      return queryResult;
    }

    const queryEmbedding = queryResult.embedding;

    // Calculate similarities
    const results = documents.map((doc) => ({
      ...doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    // Sort by similarity and take top K
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, topK);

    return {
      success: true,
      query,
      results: topResults,
      count: topResults.length,
      metadata: {
        model,
        timestamp: Date.now(),
        totalDocuments: documents.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results: null,
      metadata: {
        model,
        timestamp: Date.now(),
        errorType: error.constructor.name,
      },
    };
  }
}

// ============================================================================
// Pre-built Tools for Common Tasks
// ============================================================================

/**
 * Pre-built tool: Web search simulation
 * Replace with actual search API in production
 */
export const searchTool = tool({
  description: 'Search the web for information on a given topic',
  parameters: z.object({
    query: z.string().describe('The search query'),
    limit: z.number().optional().describe('Maximum number of results (default: 5)'),
  }),
  execute: async ({ query, limit = 5 }) => {
    // This is a placeholder - integrate with actual search API
    return {
      query,
      results: [
        {
          title: `Result for: ${query}`,
          snippet: 'This is a placeholder result. Integrate with a real search API.',
          url: 'https://example.com',
        },
      ],
      message: 'Note: This is a mock search. Implement real search API integration.',
    };
  },
});

/**
 * Pre-built tool: Calculator
 */
export const calculatorTool = tool({
  description: 'Perform mathematical calculations',
  parameters: z.object({
    expression: z.string().describe('The mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)")'),
  }),
  execute: async ({ expression }) => {
    try {
      // Safe evaluation of basic math expressions
      // In production, use a proper math parser library
      const result = Function('"use strict"; return (' + expression + ')')();
      return {
        expression,
        result,
        success: true,
      };
    } catch (error) {
      return {
        expression,
        error: error.message,
        success: false,
      };
    }
  },
});

/**
 * Pre-built tool: Current date/time
 */
export const dateTimeTool = tool({
  description: 'Get the current date and time',
  parameters: z.object({
    timezone: z.string().optional().describe('Timezone (e.g., "America/New_York")'),
    format: z.enum(['iso', 'unix', 'human']).optional().describe('Output format'),
  }),
  execute: async ({ timezone, format = 'iso' }) => {
    const now = new Date();

    const options = timezone ? { timeZone: timezone } : {};

    const formatted = {
      iso: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000),
      human: now.toLocaleString('en-US', options),
    };

    return {
      timestamp: formatted[format],
      timezone: timezone || 'UTC',
      format,
    };
  },
});

// ============================================================================
// Workflow Utilities
// ============================================================================

/**
 * Chain multiple workflow nodes together
 * Each node receives the output of the previous node
 *
 * @param {Array<Function>} nodes - Array of node functions
 * @param {*} initialInput - Initial input for the first node
 * @param {WorkflowContext} [context] - Workflow context
 * @returns {Promise<Object>} Final output and execution history
 */
export async function chainNodes(nodes, initialInput, context = null) {
  const ctx = context || new WorkflowContext();
  const results = [];
  let currentInput = initialInput;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const result = await node(currentInput, ctx);
    results.push({
      nodeIndex: i,
      result,
      timestamp: Date.now(),
    });

    if (!result.success) {
      return {
        success: false,
        error: `Node ${i} failed: ${result.error}`,
        results,
        metadata: ctx.getMetadata(),
      };
    }

    // Pass output to next node
    currentInput = result.text || result.object || result.embedding || result;
  }

  return {
    success: true,
    finalOutput: currentInput,
    results,
    metadata: ctx.getMetadata(),
  };
}

/**
 * Execute multiple nodes in parallel
 *
 * @param {Array<{node: Function, input: *}>} nodeConfigs - Array of node configs
 * @param {WorkflowContext} [context] - Workflow context
 * @returns {Promise<Object>} All results
 */
export async function parallelNodes(nodeConfigs, context = null) {
  const ctx = context || new WorkflowContext();

  const promises = nodeConfigs.map(({ node, input }) =>
    node(input, ctx).catch(error => ({
      success: false,
      error: error.message,
    }))
  );

  const results = await Promise.all(promises);

  const allSucceeded = results.every(r => r.success);

  return {
    success: allSucceeded,
    results,
    metadata: ctx.getMetadata(),
  };
}

/**
 * Conditional branching based on a predicate
 *
 * @param {Function} predicate - Function that returns true/false
 * @param {Function} trueBranch - Node to execute if true
 * @param {Function} falseBranch - Node to execute if false
 * @param {*} input - Input for the selected branch
 * @param {WorkflowContext} [context] - Workflow context
 * @returns {Promise<Object>} Result from selected branch
 */
export async function conditionalNode(predicate, trueBranch, falseBranch, input, context = null) {
  const ctx = context || new WorkflowContext();

  const condition = await predicate(input);
  const selectedBranch = condition ? trueBranch : falseBranch;

  const result = await selectedBranch(input, ctx);

  return {
    ...result,
    branchTaken: condition ? 'true' : 'false',
    metadata: {
      ...result.metadata,
      ...ctx.getMetadata(),
    },
  };
}

/**
 * Retry a node with exponential backoff
 *
 * @param {Function} node - Node function to retry
 * @param {*} input - Input for the node
 * @param {number} [maxRetries] - Maximum retry attempts
 * @param {number} [initialDelay] - Initial delay in ms
 * @param {WorkflowContext} [context] - Workflow context
 * @returns {Promise<Object>} Node result
 */
export async function retryNode(node, input, maxRetries = 3, initialDelay = 1000, context = null) {
  const ctx = context || new WorkflowContext();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await node(input, ctx);

    if (result.success) {
      return {
        ...result,
        attempts: attempt + 1,
      };
    }

    if (attempt < maxRetries) {
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries + 1} attempts`,
    attempts: maxRetries + 1,
    metadata: ctx.getMetadata(),
  };
}

// ============================================================================
// Image Generation Nodes
// ============================================================================

/**
 * Generate images using OpenAI DALL-E models
 *
 * @param {Object} params - Generation parameters
 * @param {string} params.prompt - The prompt to generate image from
 * @param {string} [params.model] - Model to use (dall-e-2, dall-e-3, gpt-image-1, gpt-image-1-mini)
 * @param {string} [params.size] - Image size (dall-e-2: 256x256, 512x512, 1024x1024; dall-e-3: 1024x1024, 1792x1024, 1024x1792)
 * @param {string} [params.quality] - Image quality ('standard' or 'hd', dall-e-3 only)
 * @param {string} [params.style] - Image style ('natural' or 'vivid', dall-e-3 only)
 * @param {WorkflowContext} [params.context] - Workflow context
 * @param {AbortSignal} [params.abortSignal] - Abort signal for cancellation
 * @returns {Promise<Object>} Generated image data
 */
export async function generateImageNode({
  prompt,
  model = 'dall-e-3',
  size = '1024x1024',
  quality = 'standard',
  style = 'natural',
  response_format = 'b64_json', // Changed default to b64_json for attachments
  background = 'auto',
  moderation = 'auto',
  output_format = 'png',
  output_compression = 100,
  n = 1,
  stream = false,
  partial_images = 0,
  context = new WorkflowContext(),
  abortSignal,
}) {
  const startTime = Date.now();

  try {
    context.incrementNodeExecutions();

    // Use OpenAI SDK directly for image generation
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const requestOptions = {
      model,
      prompt,
      size,
      n,
    };

    // Add response_format for DALL-E 2/3 (not gpt-image-1)
    if (!model.startsWith('gpt-image-')) {
      requestOptions.response_format = response_format;
    }

    // Add quality and style for dall-e-3 and gpt-image-*
    if (model === 'dall-e-3' || model.startsWith('gpt-image-')) {
      if (quality !== 'standard') requestOptions.quality = quality;
      if (model === 'dall-e-3' && style) requestOptions.style = style;
    }

    // gpt-image-1 specific parameters
    if (model.startsWith('gpt-image-')) {
      if (background !== 'auto') requestOptions.background = background;
      if (moderation !== 'auto') requestOptions.moderation = moderation;
      if (output_format !== 'png') requestOptions.output_format = output_format;
      if (output_compression !== 100) requestOptions.output_compression = output_compression;
      if (stream) requestOptions.stream = stream;
      if (partial_images > 0) requestOptions.partial_images = partial_images;
    }

    const response = await client.images.generate(requestOptions);

    const imageData = response.data[0];

    // For b64_json, prepend data URI prefix for direct use in <img> tags
    let imageResult = imageData.url || imageData.b64_json;
    const format = imageData.url ? 'url' : 'base64';

    if (format === 'base64' && !imageResult.startsWith('data:')) {
      // Determine MIME type from output_format or default to png
      const mimeType = output_format === 'jpeg' ? 'image/jpeg' :
                       output_format === 'webp' ? 'image/webp' :
                       'image/png';
      imageResult = `data:${mimeType};base64,${imageResult}`;
    }

    return {
      success: true,
      image: imageResult,
      format,
      revisedPrompt: imageData.revised_prompt,
      metadata: {
        model,
        size,
        quality,
        style,
        response_format,
        background,
        moderation,
        output_format,
        output_compression,
        n,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      image: null,
      error: error.message,
      metadata: {
        model,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime,
        errorType: error.constructor.name,
      },
    };
  }
}

/**
 * Edit an image using OpenAI DALL-E 2
 *
 * @param {Object} params - Edit parameters
 * @param {string} params.prompt - Description of the desired edits
 * @param {string} params.image - Base64 data URI or URL of the image to edit
 * @param {string} [params.mask] - Optional base64 data URI or URL of the mask image
 * @param {string} [params.model] - Model to use (only dall-e-2 supported)
 * @param {string} [params.size] - Size of generated image (256x256, 512x512, 1024x1024)
 * @param {number} [params.n] - Number of images to generate (1-10)
 * @param {string} [params.response_format] - Response format (url or b64_json)
 * @param {WorkflowContext} [params.context] - Workflow context
 * @param {AbortSignal} [params.abortSignal] - Abort signal for cancellation
 * @returns {Promise<Object>} Edited image data
 */
export async function editImageNode({
  prompt,
  image,
  mask,
  model = 'dall-e-2',
  size = '1024x1024',
  n = 1,
  response_format = 'b64_json',
  context = new WorkflowContext(),
  abortSignal,
}) {
  const startTime = Date.now();

  try {
    context.incrementNodeExecutions();

    // Use OpenAI SDK directly
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Helper function to convert base64 data URI to File object
    const dataURItoFile = (dataURI, filename) => {
      // Extract base64 data (remove data:image/xxx;base64, prefix if present)
      const base64Data = dataURI.includes(',') ? dataURI.split(',')[1] : dataURI;
      const buffer = Buffer.from(base64Data, 'base64');

      // Determine MIME type from data URI or default to png
      let mimeType = 'image/png';
      if (dataURI.startsWith('data:')) {
        const match = dataURI.match(/data:([^;]+);/);
        if (match) mimeType = match[1];
      }

      return new File([buffer], filename, { type: mimeType });
    };

    // Convert image (required) to File
    const imageFile = dataURItoFile(image, 'image.png');

    // Prepare request options
    const requestOptions = {
      image: imageFile,
      prompt,
      model,
      n,
      size,
      response_format,
    };

    // Add mask if provided
    if (mask) {
      const maskFile = dataURItoFile(mask, 'mask.png');
      requestOptions.mask = maskFile;
    }

    if (abortSignal) {
      requestOptions.signal = abortSignal;
    }

    const response = await client.images.edit(requestOptions);

    const imageData = response.data[0];

    // For b64_json, prepend data URI prefix for direct use in <img> tags
    let imageResult = imageData.url || imageData.b64_json;
    const format = imageData.url ? 'url' : 'base64';

    if (format === 'base64' && !imageResult.startsWith('data:')) {
      imageResult = `data:image/png;base64,${imageResult}`;
    }

    return {
      success: true,
      image: imageResult,
      format,
      metadata: {
        model,
        size,
        response_format,
        n,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      image: null,
      error: error.message,
      metadata: {
        model,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime,
        errorType: error.constructor.name,
      },
    };
  }
}

/**
 * Create a variation of an image using OpenAI DALL-E 2
 *
 * @param {Object} params - Variation parameters
 * @param {string} params.image - Base64 data URI or URL of the image
 * @param {string} [params.model] - Model to use (only dall-e-2 supported)
 * @param {string} [params.size] - Size of generated image (256x256, 512x512, 1024x1024)
 * @param {number} [params.n] - Number of images to generate (1-10)
 * @param {string} [params.response_format] - Response format (url or b64_json)
 * @param {WorkflowContext} [params.context] - Workflow context
 * @param {AbortSignal} [params.abortSignal] - Abort signal for cancellation
 * @returns {Promise<Object>} Image variation data
 */
export async function createImageVariationNode({
  image,
  model = 'dall-e-2',
  size = '1024x1024',
  n = 1,
  response_format = 'b64_json',
  context = new WorkflowContext(),
  abortSignal,
}) {
  const startTime = Date.now();

  try {
    context.incrementNodeExecutions();

    // Use OpenAI SDK directly
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Helper function to convert base64 data URI to File object
    const dataURItoFile = (dataURI, filename) => {
      // Extract base64 data (remove data:image/xxx;base64, prefix if present)
      const base64Data = dataURI.includes(',') ? dataURI.split(',')[1] : dataURI;
      const buffer = Buffer.from(base64Data, 'base64');

      // Determine MIME type from data URI or default to png
      let mimeType = 'image/png';
      if (dataURI.startsWith('data:')) {
        const match = dataURI.match(/data:([^;]+);/);
        if (match) mimeType = match[1];
      }

      return new File([buffer], filename, { type: mimeType });
    };

    // Convert image to File
    const imageFile = dataURItoFile(image, 'image.png');

    const requestOptions = {
      image: imageFile,
      model,
      n,
      size,
      response_format,
    };

    if (abortSignal) {
      requestOptions.signal = abortSignal;
    }

    const response = await client.images.createVariation(requestOptions);

    const imageData = response.data[0];

    // For b64_json, prepend data URI prefix for direct use in <img> tags
    let imageResult = imageData.url || imageData.b64_json;
    const format = imageData.url ? 'url' : 'base64';

    if (format === 'base64' && !imageResult.startsWith('data:')) {
      imageResult = `data:image/png;base64,${imageResult}`;
    }

    return {
      success: true,
      image: imageResult,
      format,
      metadata: {
        model,
        size,
        response_format,
        n,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      image: null,
      error: error.message,
      metadata: {
        model,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime,
        errorType: error.constructor.name,
      },
    };
  }
}

// ============================================================================
// Speech Generation Nodes
// ============================================================================

/**
 * Generate speech from text using OpenAI TTS models
 *
 * @param {Object} params - Generation parameters
 * @param {string} params.text - The text to convert to speech
 * @param {string} [params.model] - Model to use (tts-1, tts-1-hd, gpt-4o-mini-tts)
 * @param {string} [params.voice] - Voice to use (alloy, echo, fable, onyx, nova, shimmer)
 * @param {number} [params.speed] - Speed of speech (0.25 to 4.0)
 * @param {string} [params.responseFormat] - Audio format (mp3, opus, aac, flac, wav, pcm)
 * @param {string} [params.instructions] - Additional voice instructions (not for tts-1/tts-1-hd)
 * @param {WorkflowContext} [params.context] - Workflow context
 * @param {AbortSignal} [params.abortSignal] - Abort signal for cancellation
 * @returns {Promise<Object>} Generated audio data
 */
export async function generateSpeechNode({
  text,
  model = 'tts-1',
  voice = 'alloy',
  speed = 1.0,
  responseFormat = 'mp3',
  instructions,
  context = new WorkflowContext(),
  abortSignal,
}) {
  const startTime = Date.now();

  try {
    context.incrementNodeExecutions();

    // Use OpenAI SDK directly for speech generation
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const requestOptions = {
      model,
      input: text,
      voice,
      speed,
      response_format: responseFormat,
    };

    // Add instructions for newer models
    if (instructions && !['tts-1', 'tts-1-hd'].includes(model)) {
      requestOptions.instructions = instructions;
    }

    const response = await client.audio.speech.create(requestOptions);

    // Convert response to buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64Audio = buffer.toString('base64');

    return {
      success: true,
      audio: base64Audio,
      format: responseFormat,
      metadata: {
        model,
        voice,
        speed,
        responseFormat,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      audio: null,
      error: error.message,
      metadata: {
        model,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime,
        errorType: error.constructor.name,
      },
    };
  }
}

// ============================================================================
// Audio Transcription Nodes
// ============================================================================

/**
 * Transcribe audio to text using OpenAI Whisper models
 *
 * @param {Object} params - Transcription parameters
 * @param {Buffer|Uint8Array} params.audio - Audio file data
 * @param {string} [params.model] - Model to use (whisper-1, gpt-4o-mini-transcribe, gpt-4o-transcribe)
 * @param {string} [params.language] - Input language in ISO-639-1 format (e.g., 'en')
 * @param {string} [params.prompt] - Optional text to guide the model's style
 * @param {number} [params.temperature] - Sampling temperature (0-1)
 * @param {string[]} [params.timestampGranularities] - Timestamp granularities (['word'], ['segment'], or both)
 * @param {WorkflowContext} [params.context] - Workflow context
 * @param {AbortSignal} [params.abortSignal] - Abort signal for cancellation
 * @returns {Promise<Object>} Transcription result
 */
export async function transcribeAudioNode({
  audio,
  model = 'whisper-1',
  language,
  prompt,
  temperature = 0,
  timestampGranularities = ['segment'],
  context = new WorkflowContext(),
  abortSignal,
}) {
  const startTime = Date.now();

  try {
    context.incrementNodeExecutions();

    // Use OpenAI SDK directly for transcription
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create a File object from audio data
    const audioFile = new File([audio], 'audio.mp3', { type: 'audio/mpeg' });

    const requestOptions = {
      file: audioFile,
      model,
      temperature,
    };

    // Add optional parameters
    if (language) requestOptions.language = language;
    if (prompt) requestOptions.prompt = prompt;
    if (timestampGranularities.length > 0) {
      requestOptions.timestamp_granularities = timestampGranularities;
    }

    const response = await client.audio.transcriptions.create(requestOptions);

    return {
      success: true,
      text: response.text,
      language: response.language,
      duration: response.duration,
      segments: response.segments || [],
      words: response.words || [],
      metadata: {
        model,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      text: null,
      error: error.message,
      metadata: {
        model,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime,
        errorType: error.constructor.name,
      },
    };
  }
}

// ============================================================================
// Export all functionality
// ============================================================================

export default {
  // Context
  WorkflowContext,

  // Text Generation
  generateTextNode,
  streamTextNode,

  // Structured Data
  generateStructuredDataNode,

  // Tools
  generateWithToolsNode,

  // Embeddings
  generateEmbeddingNode,
  generateEmbeddingsBatchNode,
  semanticSearchNode,
  cosineSimilarity,

  // Image Generation
  generateImageNode,

  // Speech Generation
  generateSpeechNode,

  // Audio Transcription
  transcribeAudioNode,

  // Pre-built Tools
  searchTool,
  calculatorTool,
  dateTimeTool,

  // Utilities
  chainNodes,
  parallelNodes,
  conditionalNode,
  retryNode,
};

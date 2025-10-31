/**
 * Example Usage Patterns for OpenAI Workflow Library
 *
 * This file contains practical examples for integrating the workflow library
 * with a visual node-based interface.
 */

import {
  WorkflowContext,
  generateTextNode,
  streamTextNode,
  generateStructuredDataNode,
  generateWithToolsNode,
  generateEmbeddingNode,
  generateEmbeddingsBatchNode,
  semanticSearchNode,
  searchTool,
  calculatorTool,
  dateTimeTool,
  chainNodes,
  parallelNodes,
  conditionalNode,
} from './openai-workflow.mjs';

import { z } from 'zod';

// ============================================================================
// Example 1: Simple Text Generation Workflow
// ============================================================================

export async function simpleTextGenerationExample() {
  console.log('=== Simple Text Generation ===');

  const context = new WorkflowContext();

  const result = await generateTextNode({
    prompt: 'Write a haiku about programming',
    model: 'gpt-4o-mini',
    temperature: 0.9,
    systemPrompt: 'You are a creative poet',
    context,
  });

  if (result.success) {
    console.log('Generated text:', result.text);
    console.log('Tokens used:', result.usage.totalTokens);
  } else {
    console.error('Error:', result.error);
  }

  console.log('Workflow metadata:', context.getMetadata());
}

// ============================================================================
// Example 2: Streaming Chat Interface
// ============================================================================

export async function streamingChatExample() {
  console.log('=== Streaming Chat ===');

  let fullResponse = '';

  await streamTextNode({
    prompt: 'Explain how neural networks work in 3 paragraphs',
    model: 'gpt-4o-mini',
    systemPrompt: 'You are an AI educator',
    onChunk: (chunk, accumulated) => {
      // In a real UI, this would update a text component
      process.stdout.write(chunk);
      fullResponse = accumulated;
    },
    onFinish: (result) => {
      console.log('\n\nStreaming complete!');
      console.log('Total tokens:', result.usage.totalTokens);
      console.log('Finish reason:', result.finishReason);
    },
    onError: (error) => {
      console.error('Streaming error:', error);
    },
  });

  return fullResponse;
}

// ============================================================================
// Example 3: Structured Data Extraction
// ============================================================================

export async function structuredDataExample() {
  console.log('=== Structured Data Extraction ===');

  // Define schema for recipe extraction
  const recipeSchema = z.object({
    name: z.string().describe('Recipe name'),
    ingredients: z.array(z.object({
      item: z.string(),
      amount: z.string(),
    })).describe('List of ingredients'),
    steps: z.array(z.string()).describe('Cooking steps'),
    prepTime: z.number().describe('Preparation time in minutes'),
    cookTime: z.number().describe('Cooking time in minutes'),
    servings: z.number().describe('Number of servings'),
  });

  const result = await generateStructuredDataNode({
    prompt: `
      Extract the recipe:

      Chocolate Chip Cookies

      You'll need 2 cups flour, 1 cup butter, 1 cup sugar, 2 eggs, 1 tsp vanilla, 2 cups chocolate chips.

      1. Preheat oven to 350°F
      2. Mix butter and sugar
      3. Add eggs and vanilla
      4. Mix in flour
      5. Fold in chocolate chips
      6. Bake for 12 minutes

      Prep: 15 min, Cook: 12 min, Makes 24 cookies
    `,
    schema: recipeSchema,
    schemaName: 'recipe',
    schemaDescription: 'A structured recipe with ingredients and steps',
    model: 'gpt-4o-mini',
  });

  if (result.success) {
    console.log('Extracted recipe:', JSON.stringify(result.object, null, 2));
  } else {
    console.error('Extraction failed:', result.error);
  }

  return result;
}

// ============================================================================
// Example 4: Tool Calling - Multi-Step Research
// ============================================================================

export async function toolCallingExample() {
  console.log('=== Tool Calling Example ===');

  const context = new WorkflowContext();

  const result = await generateWithToolsNode({
    prompt: `
      I need to plan a trip. Can you:
      1. Get today's date
      2. Calculate how many days until December 25th
      3. Search for best winter destinations
    `,
    tools: {
      search: searchTool,
      calculator: calculatorTool,
      datetime: dateTimeTool,
    },
    model: 'gpt-4o-mini',
    maxSteps: 10,
    systemPrompt: 'You are a helpful travel planning assistant',
    context,
    onStepFinish: (step) => {
      console.log(`\n--- Step ${step.stepType} ---`);
      if (step.toolCalls && step.toolCalls.length > 0) {
        step.toolCalls.forEach(call => {
          console.log(`Tool called: ${call.toolName}`);
          console.log(`Arguments:`, call.args);
        });
      }
      if (step.toolResults && step.toolResults.length > 0) {
        step.toolResults.forEach(result => {
          console.log(`Tool result:`, result.result);
        });
      }
      if (step.text) {
        console.log(`Generated text: ${step.text}`);
      }
    },
  });

  if (result.success) {
    console.log('\n=== Final Response ===');
    console.log(result.text);
    console.log('\nTotal tool calls:', result.toolCalls.length);
    console.log('Steps taken:', result.steps.length);
  } else {
    console.error('Tool calling failed:', result.error);
  }

  return result;
}

// ============================================================================
// Example 5: Semantic Search with Embeddings
// ============================================================================

export async function semanticSearchExample() {
  console.log('=== Semantic Search ===');

  const context = new WorkflowContext();

  // Sample knowledge base
  const knowledgeBase = [
    'Python is a high-level programming language known for its simplicity',
    'JavaScript is primarily used for web development and runs in browsers',
    'Machine learning algorithms can learn patterns from data',
    'React is a JavaScript library for building user interfaces',
    'Neural networks are inspired by biological neural networks',
    'TypeScript adds static typing to JavaScript',
    'Deep learning is a subset of machine learning using neural networks',
    'Node.js allows JavaScript to run on the server side',
  ];

  // Generate embeddings for all documents
  console.log('Generating embeddings for knowledge base...');
  const embeddingResult = await generateEmbeddingsBatchNode({
    texts: knowledgeBase,
    model: 'text-embedding-3-small',
    context,
  });

  if (!embeddingResult.success) {
    console.error('Embedding generation failed:', embeddingResult.error);
    return;
  }

  // Prepare documents
  const documents = knowledgeBase.map((text, i) => ({
    text,
    embedding: embeddingResult.embeddings[i],
    id: i,
  }));

  // Perform semantic search
  const queries = [
    'What is AI?',
    'Tell me about web development',
    'Programming languages for beginners',
  ];

  for (const query of queries) {
    console.log(`\n--- Search: "${query}" ---`);

    const searchResult = await semanticSearchNode({
      query,
      documents,
      topK: 3,
      model: 'text-embedding-3-small',
      context,
    });

    if (searchResult.success) {
      searchResult.results.forEach((result, i) => {
        console.log(`${i + 1}. [Score: ${result.similarity.toFixed(3)}] ${result.text}`);
      });
    }
  }

  console.log('\nTotal tokens used:', context.getMetadata().totalTokens);
}

// ============================================================================
// Example 6: Sequential Workflow Chain
// ============================================================================

export async function sequentialChainExample() {
  console.log('=== Sequential Workflow Chain ===');

  const context = new WorkflowContext();

  // Define workflow steps
  const steps = [
    // Step 1: Generate initial content
    (input, ctx) => generateTextNode({
      prompt: `Write a one-paragraph product description for: ${input}`,
      context: ctx,
    }),

    // Step 2: Extract key features
    (input, ctx) => generateStructuredDataNode({
      prompt: `Extract key features from this description: ${input}`,
      schema: z.object({
        features: z.array(z.string()).describe('Key product features'),
        target_audience: z.string().describe('Target customer demographic'),
      }),
      context: ctx,
    }),

    // Step 3: Generate marketing tagline
    (input, ctx) => generateTextNode({
      prompt: `Create a catchy marketing tagline based on these features: ${JSON.stringify(input)}`,
      context: ctx,
    }),
  ];

  const result = await chainNodes(
    steps,
    'Smart Home Security Camera',
    context,
  );

  if (result.success) {
    console.log('=== Workflow Results ===');
    result.results.forEach((step, i) => {
      console.log(`\nStep ${i + 1}:`);
      console.log(JSON.stringify(step.result, null, 2));
    });
    console.log('\n=== Final Output ===');
    console.log(result.finalOutput);
  }

  console.log('\nWorkflow metadata:', result.metadata);
}

// ============================================================================
// Example 7: Parallel Processing
// ============================================================================

export async function parallelProcessingExample() {
  console.log('=== Parallel Processing ===');

  const context = new WorkflowContext();

  // Process multiple tasks simultaneously
  const tasks = [
    {
      node: (input, ctx) => generateTextNode({
        prompt: `Summarize in one sentence: ${input}`,
        context: ctx,
      }),
      input: 'Artificial intelligence is transforming industries through automation and data analysis.',
    },
    {
      node: (input, ctx) => generateStructuredDataNode({
        prompt: `Extract sentiment from: ${input}`,
        schema: z.object({
          sentiment: z.enum(['positive', 'negative', 'neutral']),
          confidence: z.number().min(0).max(1),
        }),
        context: ctx,
      }),
      input: 'This product exceeded my expectations! Highly recommended.',
    },
    {
      node: (input, ctx) => generateTextNode({
        prompt: `Translate to Spanish: ${input}`,
        context: ctx,
      }),
      input: 'Hello, how are you today?',
    },
  ];

  const result = await parallelNodes(tasks, context);

  if (result.success) {
    console.log('All tasks completed successfully:');
    result.results.forEach((taskResult, i) => {
      console.log(`\nTask ${i + 1}:`, taskResult);
    });
  } else {
    console.log('Some tasks failed:', result.results);
  }

  console.log('\nMetadata:', result.metadata);
}

// ============================================================================
// Example 8: Conditional Workflow
// ============================================================================

export async function conditionalWorkflowExample() {
  console.log('=== Conditional Workflow ===');

  const context = new WorkflowContext();

  // Sentiment analysis with conditional response
  const analyzeAndRespond = async (userInput) => {
    // First, analyze sentiment
    const sentimentResult = await generateStructuredDataNode({
      prompt: `Analyze sentiment: ${userInput}`,
      schema: z.object({
        sentiment: z.enum(['positive', 'negative', 'neutral']),
        score: z.number(),
      }),
      context,
    });

    if (!sentimentResult.success) {
      return sentimentResult;
    }

    const sentiment = sentimentResult.object.sentiment;

    // Conditional branching based on sentiment
    const predicate = () => sentiment === 'positive';

    const positiveResponse = (input, ctx) => generateTextNode({
      prompt: 'Generate an enthusiastic, positive response',
      context: ctx,
    });

    const negativeResponse = (input, ctx) => generateTextNode({
      prompt: 'Generate an empathetic, helpful response',
      context: ctx,
    });

    return await conditionalNode(
      predicate,
      positiveResponse,
      negativeResponse,
      userInput,
      context,
    );
  };

  // Test with different inputs
  const inputs = [
    'I love this product!',
    'This is terrible, I want a refund',
  ];

  for (const input of inputs) {
    console.log(`\nInput: "${input}"`);
    const result = await analyzeAndRespond(input);
    console.log('Response:', result.text);
    console.log('Branch taken:', result.branchTaken);
  }
}

// ============================================================================
// Example 9: Visual Node Execution Handler
// ============================================================================

export async function executeVisualNode(node) {
  console.log('=== Visual Node Execution ===');

  const { type, data } = node;
  const context = new WorkflowContext();

  // Store node ID in context
  context.set('currentNodeId', node.id);

  let result;

  switch (type) {
    case 'text-generation':
      result = await generateTextNode({
        prompt: data.input,
        model: data.config?.model || 'gpt-4o-mini',
        temperature: data.config?.temperature || 0.7,
        maxTokens: data.config?.maxTokens || 2048,
        systemPrompt: data.config?.systemPrompt || '',
        context,
      });
      break;

    case 'streaming-text':
      result = await streamTextNode({
        prompt: data.input,
        model: data.config?.model || 'gpt-4o-mini',
        temperature: data.config?.temperature || 0.7,
        onChunk: (chunk, fullText) => {
          // Update UI with progressive text
          updateNodeOutput(node.id, fullText);
          updateNodeStatus(node.id, 'processing');
        },
        onFinish: (finishResult) => {
          updateNodeStatus(node.id, 'completed');
        },
        onError: (error) => {
          updateNodeStatus(node.id, 'error');
          updateNodeError(node.id, error.message);
        },
        context,
      });
      break;

    case 'structured-data':
      result = await generateStructuredDataNode({
        prompt: data.input,
        schema: data.config?.schema || z.object({}),
        schemaName: data.config?.schemaName || 'output',
        model: data.config?.model || 'gpt-4o-mini',
        context,
      });
      break;

    case 'tool-calling':
      // Load tools based on configuration
      const tools = loadConfiguredTools(data.config?.tools || []);

      result = await generateWithToolsNode({
        prompt: data.input,
        tools,
        model: data.config?.model || 'gpt-4o-mini',
        maxSteps: data.config?.maxSteps || 5,
        onStepFinish: (step) => {
          // Update UI with tool execution progress
          updateNodeToolCalls(node.id, step.toolCalls);
        },
        context,
      });
      break;

    case 'embedding':
      result = await generateEmbeddingNode({
        text: data.input,
        model: data.config?.model || 'text-embedding-3-small',
        dimensions: data.config?.dimensions,
        context,
      });
      break;

    case 'semantic-search':
      // Get documents from connected nodes
      const documents = await getConnectedDocuments(node.id);

      result = await semanticSearchNode({
        query: data.input,
        documents,
        topK: data.config?.topK || 5,
        model: data.config?.model || 'text-embedding-3-small',
        context,
      });
      break;

    default:
      throw new Error(`Unknown node type: ${type}`);
  }

  // Update node with result
  if (result.success) {
    updateNodeOutput(node.id, result.text || result.object || result.embedding);
    updateNodeStatus(node.id, 'completed');
  } else {
    updateNodeError(node.id, result.error);
    updateNodeStatus(node.id, 'error');
  }

  // Update usage statistics
  updateNodeMetadata(node.id, context.getMetadata());

  return result;
}

// ============================================================================
// Helper Functions for Visual Interface
// ============================================================================

function loadConfiguredTools(toolNames) {
  const availableTools = {
    search: searchTool,
    calculator: calculatorTool,
    datetime: dateTimeTool,
  };

  return toolNames.reduce((acc, name) => {
    if (availableTools[name]) {
      acc[name] = availableTools[name];
    }
    return acc;
  }, {});
}

function updateNodeOutput(nodeId, output) {
  // Implementation would update the visual node's output display
  console.log(`[Node ${nodeId}] Output:`, output);
}

function updateNodeStatus(nodeId, status) {
  // Implementation would update the visual node's status indicator
  console.log(`[Node ${nodeId}] Status:`, status);
}

function updateNodeError(nodeId, error) {
  // Implementation would display error in the visual node
  console.log(`[Node ${nodeId}] Error:`, error);
}

function updateNodeToolCalls(nodeId, toolCalls) {
  // Implementation would show tool calls in the visual node
  console.log(`[Node ${nodeId}] Tool calls:`, toolCalls);
}

function updateNodeMetadata(nodeId, metadata) {
  // Implementation would update node metadata display
  console.log(`[Node ${nodeId}] Metadata:`, metadata);
}

async function getConnectedDocuments(nodeId) {
  // Implementation would get documents from connected nodes
  // This is a placeholder
  return [];
}

// ============================================================================
// Run All Examples
// ============================================================================

export async function runAllExamples() {
  console.log('Running all examples...\n');

  try {
    await simpleTextGenerationExample();
    console.log('\n' + '='.repeat(60) + '\n');

    await streamingChatExample();
    console.log('\n' + '='.repeat(60) + '\n');

    await structuredDataExample();
    console.log('\n' + '='.repeat(60) + '\n');

    await toolCallingExample();
    console.log('\n' + '='.repeat(60) + '\n');

    await semanticSearchExample();
    console.log('\n' + '='.repeat(60) + '\n');

    await sequentialChainExample();
    console.log('\n' + '='.repeat(60) + '\n');

    await parallelProcessingExample();
    console.log('\n' + '='.repeat(60) + '\n');

    await conditionalWorkflowExample();
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Export all examples
export default {
  simpleTextGenerationExample,
  streamingChatExample,
  structuredDataExample,
  toolCallingExample,
  semanticSearchExample,
  sequentialChainExample,
  parallelProcessingExample,
  conditionalWorkflowExample,
  executeVisualNode,
};

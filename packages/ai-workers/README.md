# OpenAI Workflow Library

A comprehensive library for building visual node-based AI workflows using the Vercel AI SDK. This library is designed to work seamlessly with a visual node-based interface where users can create complex AI workflows by connecting different types of nodes.

## Features

### Core Capabilities

- **Text Generation**: Generate text responses with full streaming support
- **Structured Data**: Extract structured data that conforms to Zod schemas
- **Tool Calling**: Enable AI models to call external functions and tools
- **Embeddings**: Generate vector embeddings for semantic search and similarity
- **Context Management**: Track execution state across workflow nodes
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Workflow Utilities**: Chain, parallel, conditional, and retry patterns

### Pre-built Tools

- **Search Tool**: Web search integration (placeholder for real API)
- **Calculator Tool**: Mathematical expression evaluation
- **DateTime Tool**: Current date/time with timezone support

## Installation

The library requires the following dependencies (already in package.json):

```json
{
  "ai": "beta",
  "@ai-sdk/openai": "beta"
}
```

## Quick Start

### Basic Text Generation

```javascript
import { generateTextNode, WorkflowContext } from './_library/openai-workflow';

const context = new WorkflowContext();

const result = await generateTextNode({
  prompt: 'Explain quantum computing in simple terms',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  context,
});

console.log(result.text);
```

### Streaming Text

```javascript
import { streamTextNode } from './_library/openai-workflow';

await streamTextNode({
  prompt: 'Write a short story about AI',
  onChunk: (chunk, fullText) => {
    console.log('New chunk:', chunk);
    // Update UI with progressive text
  },
  onFinish: (result) => {
    console.log('Streaming complete:', result.text);
  },
});
```

### Structured Data Extraction

```javascript
import { generateStructuredDataNode } from './_library/openai-workflow';
import { z } from 'zod';

const schema = z.object({
  name: z.string().describe('Person name'),
  age: z.number().describe('Person age'),
  email: z.string().email().describe('Email address'),
});

const result = await generateStructuredDataNode({
  prompt: 'Extract contact info: John Doe, 30 years old, john@example.com',
  schema,
  schemaName: 'contact',
  schemaDescription: 'Contact information',
});

console.log(result.object);
// { name: 'John Doe', age: 30, email: 'john@example.com' }
```

### Tool Calling

```javascript
import { generateWithToolsNode, searchTool, calculatorTool } from './_library/openai-workflow';

const result = await generateWithToolsNode({
  prompt: 'What is 15% of 200? Then search for tips on calculating percentages.',
  tools: {
    calculator: calculatorTool,
    search: searchTool,
  },
  onStepFinish: (step) => {
    console.log('Step completed:', step.stepType);
    console.log('Tool calls:', step.toolCalls);
  },
});

console.log(result.text);
console.log('Tools used:', result.toolCalls.length);
```

### Embeddings and Semantic Search

```javascript
import {
  generateEmbeddingsBatchNode,
  semanticSearchNode
} from './_library/openai-workflow';

// Generate embeddings for documents
const docs = [
  'The cat sat on the mat',
  'Dogs are loyal companions',
  'Artificial intelligence is transforming technology',
];

const embeddingResult = await generateEmbeddingsBatchNode({
  texts: docs,
  model: 'text-embedding-3-small',
});

// Prepare documents with embeddings
const documents = docs.map((text, i) => ({
  text,
  embedding: embeddingResult.embeddings[i],
}));

// Search for similar documents
const searchResult = await semanticSearchNode({
  query: 'feline animals',
  documents,
  topK: 2,
});

console.log(searchResult.results);
// Returns documents ranked by similarity
```

## Node Types for Visual Interface

### 1. Text Generation Node

**Visual Properties:**
- Input Handle: Accepts prompt text
- Output Handle: Outputs generated text
- Status Indicator: idle → processing → completed/error
- Display: Input prompt and output text

**Configuration:**
```javascript
{
  nodeType: 'text-generation',
  config: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: 'You are a helpful assistant',
  }
}
```

### 2. Streaming Text Node

**Visual Properties:**
- Input Handle: Accepts prompt
- Output Handle: Streams text progressively
- Status Indicator: Shows streaming progress
- Display: Real-time text output

**Configuration:**
```javascript
{
  nodeType: 'streaming-text',
  config: {
    model: 'gpt-4o',
    temperature: 0.9,
    streamToUI: true,
  }
}
```

### 3. Structured Data Node

**Visual Properties:**
- Input Handle: Accepts prompt
- Output Handle: Outputs JSON object
- Schema Editor: Visual schema builder
- Display: Formatted JSON output

**Configuration:**
```javascript
{
  nodeType: 'structured-data',
  config: {
    schema: z.object({
      field1: z.string(),
      field2: z.number(),
    }),
    schemaName: 'output',
  }
}
```

### 4. Tool Calling Node

**Visual Properties:**
- Input Handle: Accepts prompt
- Output Handle: Outputs final text
- Tool Selector: Choose available tools
- Display: Shows tool calls and results

**Configuration:**
```javascript
{
  nodeType: 'tool-calling',
  config: {
    tools: ['search', 'calculator', 'datetime'],
    maxSteps: 5,
  }
}
```

### 5. Embedding Node

**Visual Properties:**
- Input Handle: Accepts text
- Output Handle: Outputs vector array
- Display: Vector dimensions and preview

**Configuration:**
```javascript
{
  nodeType: 'embedding',
  config: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
  }
}
```

### 6. Semantic Search Node

**Visual Properties:**
- Input Handle: Accepts query text
- Document Input: Connect to document source
- Output Handle: Outputs ranked results
- Display: Top results with similarity scores

**Configuration:**
```javascript
{
  nodeType: 'semantic-search',
  config: {
    topK: 5,
    minSimilarity: 0.7,
  }
}
```

## Workflow Patterns

### Sequential Chain

Connect nodes in sequence where each output feeds into the next input:

```javascript
import { chainNodes, generateTextNode, generateStructuredDataNode } from './_library/openai-workflow';
import { z } from 'zod';

const summarizeNode = (input, context) => generateTextNode({
  prompt: `Summarize this in one sentence: ${input}`,
  context,
});

const extractNode = (input, context) => generateStructuredDataNode({
  prompt: input,
  schema: z.object({
    summary: z.string(),
    keywords: z.array(z.string()),
  }),
  context,
});

const result = await chainNodes(
  [summarizeNode, extractNode],
  'Long article text here...',
);

console.log(result.finalOutput);
```

### Parallel Execution

Execute multiple nodes simultaneously:

```javascript
import { parallelNodes, generateTextNode } from './_library/openai-workflow';

const nodes = [
  {
    node: (input, ctx) => generateTextNode({
      prompt: `Translate to French: ${input}`,
      context: ctx,
    }),
    input: 'Hello world',
  },
  {
    node: (input, ctx) => generateTextNode({
      prompt: `Translate to Spanish: ${input}`,
      context: ctx,
    }),
    input: 'Hello world',
  },
];

const result = await parallelNodes(nodes);
console.log(result.results);
```

### Conditional Branching

Route execution based on conditions:

```javascript
import { conditionalNode, generateTextNode } from './_library/openai-workflow';

const predicate = (input) => input.length > 100;

const longTextNode = (input, ctx) => generateTextNode({
  prompt: `Summarize: ${input}`,
  context: ctx,
});

const shortTextNode = (input, ctx) => generateTextNode({
  prompt: `Expand on: ${input}`,
  context: ctx,
});

const result = await conditionalNode(
  predicate,
  longTextNode,
  shortTextNode,
  'Your input text',
);
```

### Retry with Backoff

Automatically retry failed nodes:

```javascript
import { retryNode, generateTextNode } from './_library/openai-workflow';

const unstableNode = (input, ctx) => generateTextNode({
  prompt: input,
  context: ctx,
});

const result = await retryNode(
  unstableNode,
  'Your prompt',
  3, // max retries
  1000, // initial delay ms
);
```

## Context Management

The `WorkflowContext` class tracks state across node executions:

```javascript
import { WorkflowContext } from './_library/openai-workflow';

const context = new WorkflowContext();

// Store data
context.set('userId', '123');
context.set('previousResult', 'some data');

// Retrieve data
const userId = context.get('userId');

// Check existence
if (context.has('userId')) {
  // ...
}

// Get execution history
const history = context.getHistory();

// Get metadata
const metadata = context.getMetadata();
console.log(metadata);
// {
//   nodeExecutions: 5,
//   totalTokens: 1200,
//   duration: 3500,
//   startTime: 1234567890
// }
```

## Creating Custom Tools

Define custom tools for the tool calling node:

```javascript
import { tool } from 'ai';
import { z } from 'zod';

export const weatherTool = tool({
  description: 'Get weather for a location',
  parameters: z.object({
    location: z.string().describe('City name'),
    units: z.enum(['celsius', 'fahrenheit']).optional(),
  }),
  execute: async ({ location, units = 'celsius' }) => {
    // Call weather API
    const weatherData = await fetchWeather(location);

    return {
      location,
      temperature: weatherData.temp,
      units,
      conditions: weatherData.conditions,
    };
  },
});

// Use in workflow
import { generateWithToolsNode } from './_library/openai-workflow';

const result = await generateWithToolsNode({
  prompt: 'What is the weather in Tokyo?',
  tools: {
    weather: weatherTool,
  },
});
```

## Advanced Tool with Context

Tools can access the full conversation context:

```javascript
export const memoryTool = tool({
  description: 'Remember or recall information from conversation',
  parameters: z.object({
    action: z.enum(['store', 'recall']),
    key: z.string(),
    value: z.string().optional(),
  }),
  execute: async ({ action, key, value }, { messages }) => {
    if (action === 'store') {
      // Store in database or context
      return { stored: true, key, value };
    } else {
      // Retrieve from storage
      return { recalled: 'Previously stored value' };
    }
  },
});
```

## Error Handling

All nodes return a consistent error format:

```javascript
const result = await generateTextNode({
  prompt: 'Test',
});

if (!result.success) {
  console.error('Error:', result.error);
  console.error('Error type:', result.metadata.errorType);
  // Handle error in UI
} else {
  console.log('Success:', result.text);
}
```

## Abort Signal Support

Cancel long-running operations:

```javascript
const controller = new AbortController();

// Start generation
const promise = generateTextNode({
  prompt: 'Very long generation...',
  abortSignal: controller.signal,
});

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  const result = await promise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Generation cancelled');
  }
}
```

## Integration with Visual Node Interface

### Node Execution

```javascript
// In your node execution handler
async function executeNode(node) {
  const { type, data } = node;

  switch (type) {
    case 'text-generation':
      return await generateTextNode({
        prompt: data.input,
        model: data.config.model,
        temperature: data.config.temperature,
        systemPrompt: data.config.systemPrompt,
      });

    case 'structured-data':
      return await generateStructuredDataNode({
        prompt: data.input,
        schema: data.config.schema,
      });

    case 'tool-calling':
      return await generateWithToolsNode({
        prompt: data.input,
        tools: loadTools(data.config.tools),
      });

    // ... other node types
  }
}
```

### Status Updates

```javascript
// Update node status during streaming
await streamTextNode({
  prompt: nodeData.input,
  onChunk: (chunk, fullText) => {
    updateNodeStatus(nodeId, 'processing');
    updateNodeOutput(nodeId, fullText);
  },
  onFinish: (result) => {
    updateNodeStatus(nodeId, 'completed');
    updateNodeOutput(nodeId, result.text);
  },
  onError: (error) => {
    updateNodeStatus(nodeId, 'error');
    updateNodeError(nodeId, error.message);
  },
});
```

## Best Practices

1. **Always use WorkflowContext** to track state across complex workflows
2. **Handle errors gracefully** - all nodes return `{ success: boolean }`
3. **Use streaming** for real-time user feedback
4. **Batch embeddings** when processing multiple texts
5. **Set appropriate timeouts** for long-running operations
6. **Use abort signals** for user-cancellable operations
7. **Monitor token usage** through context metadata
8. **Cache embeddings** for repeated semantic searches

## Performance Tips

- Use `gpt-4o-mini` for cost-effective workflows
- Use `text-embedding-3-small` for embeddings (cheaper, still effective)
- Batch operations when possible (`embedMany` vs multiple `embed` calls)
- Set `maxParallelCalls` to control API rate limits
- Use streaming for better perceived performance
- Cache frequently used embeddings

## TypeScript Support

While this library is in JavaScript, it works seamlessly with TypeScript. Type definitions are inferred from the AI SDK.

```typescript
import type { z } from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

type OutputType = z.infer<typeof schema>;

const result = await generateStructuredDataNode({
  prompt: 'Extract data',
  schema,
});

// result.object is typed as OutputType
```

## License

MIT

## Support

For issues and feature requests, please refer to the AI SDK documentation:
- https://ai-sdk.dev/docs/introduction
- https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- https://ai-sdk.dev/docs/ai-sdk-core/embeddings

# OpenAI Workflow Library - Quick Start Guide

## Setup Complete ✅

The library has been created and tested. Here's how to start using it.

## What's Included

- **openai-workflow.mjs** - Main library with all workflow functions
- **examples.mjs** - Practical usage examples
- **index.mjs** - Convenient import shortcuts
- **test.mjs** - Comprehensive test suite
- **README.md** - Full documentation
- **openai-workflow.d.ts** - TypeScript definitions

## Test Results

**79.2% success rate (19/24 tests passed)**

All core features working:
- ✅ Text generation
- ✅ Streaming
- ✅ Structured data
- ✅ Embeddings
- ✅ Semantic search
- ✅ Workflows (chain/parallel/conditional/retry)
- ⚠️ Tool calling (has SDK compatibility issue - can be added later)

## Quick Examples

### 1. Simple Text Generation

```javascript
import { generateTextNode } from './openai-workflow.mjs';

const result = await generateTextNode({
  prompt: 'Write a haiku about programming',
  model: 'gpt-4o-mini',
  temperature: 0.9,
});

console.log(result.text);
```

### 2. Streaming Text

```javascript
import { streamTextNode } from './openai-workflow.mjs';

await streamTextNode({
  prompt: 'Tell me a story',
  onChunk: (chunk, fullText) => {
    // Update your UI with each chunk
    updateNodeDisplay(nodeId, fullText);
  },
  onFinish: (result) => {
    console.log('Complete!', result.usage.totalTokens, 'tokens');
  },
});
```

### 3. Extract Structured Data

```javascript
import { generateStructuredDataNode } from './openai-workflow.mjs';
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
  hobbies: z.array(z.string()),
});

const result = await generateStructuredDataNode({
  prompt: 'Extract info: John Doe, 30, likes reading and hiking',
  schema,
});

console.log(result.object);
// { name: "John Doe", age: 30, hobbies: ["reading", "hiking"] }
```

### 4. Generate Embeddings

```javascript
import { generateEmbeddingNode } from './openai-workflow.mjs';

const result = await generateEmbeddingNode({
  text: 'Machine learning is fascinating',
  model: 'text-embedding-3-small',
});

console.log(`Embedding: ${result.dimensions} dimensions`);
console.log(result.embedding.slice(0, 5)); // First 5 values
```

### 5. Semantic Search

```javascript
import {
  generateEmbeddingsBatchNode,
  semanticSearchNode
} from './openai-workflow.mjs';

// 1. Create embeddings for your documents
const docs = [
  'Python is great for data science',
  'JavaScript powers the web',
  'Rust is fast and safe',
];

const embeddings = await generateEmbeddingsBatchNode({ texts: docs });

const documents = docs.map((text, i) => ({
  text,
  embedding: embeddings.embeddings[i],
}));

// 2. Search
const search = await semanticSearchNode({
  query: 'web development',
  documents,
  topK: 2,
});

console.log(search.results[0].text); // "JavaScript powers the web"
```

### 6. Sequential Workflow

```javascript
import { chainNodes, generateTextNode, WorkflowContext } from './openai-workflow.mjs';

const context = new WorkflowContext();

const nodes = [
  // Step 1: Generate content
  (input, ctx) => generateTextNode({
    prompt: `Write a product description for: ${input}`,
    context: ctx,
  }),

  // Step 2: Summarize it
  (input, ctx) => generateTextNode({
    prompt: `Summarize in one sentence: ${input}`,
    context: ctx,
  }),
];

const result = await chainNodes(nodes, 'Smart Watch', context);

console.log('Final output:', result.finalOutput);
console.log('Metadata:', context.getMetadata());
```

### 7. Parallel Processing

```javascript
import { parallelNodes, generateTextNode } from './openai-workflow.mjs';

const tasks = [
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

const result = await parallelNodes(tasks);

console.log('French:', result.results[0].text);
console.log('Spanish:', result.results[1].text);
```

## Integration with Visual Nodes

### Node Execution Handler

```javascript
import {
  generateTextNode,
  streamTextNode,
  generateStructuredDataNode,
  generateEmbeddingNode,
  semanticSearchNode,
  WorkflowContext,
} from './_library/openai-workflow.mjs';

async function executeNode(node) {
  const context = new WorkflowContext();
  let result;

  switch (node.type) {
    case 'text-generation':
      result = await generateTextNode({
        prompt: node.data.input,
        model: node.data.config?.model || 'gpt-4o-mini',
        temperature: node.data.config?.temperature || 0.7,
        systemPrompt: node.data.config?.systemPrompt || '',
        context,
      });
      break;

    case 'streaming-text':
      result = await streamTextNode({
        prompt: node.data.input,
        model: node.data.config?.model || 'gpt-4o-mini',
        onChunk: (chunk, fullText) => {
          updateNodeOutput(node.id, fullText);
          updateNodeStatus(node.id, 'processing');
        },
        onFinish: () => {
          updateNodeStatus(node.id, 'completed');
        },
        context,
      });
      break;

    case 'structured-data':
      result = await generateStructuredDataNode({
        prompt: node.data.input,
        schema: node.data.config?.schema,
        context,
      });
      break;

    case 'embedding':
      result = await generateEmbeddingNode({
        text: node.data.input,
        model: node.data.config?.model || 'text-embedding-3-small',
        context,
      });
      break;

    case 'semantic-search':
      const documents = await getConnectedDocuments(node.id);
      result = await semanticSearchNode({
        query: node.data.input,
        documents,
        topK: node.data.config?.topK || 5,
        context,
      });
      break;
  }

  // Update node with results
  if (result.success) {
    updateNodeOutput(node.id, result.text || result.object || result.embedding);
    updateNodeStatus(node.id, 'completed');
  } else {
    updateNodeError(node.id, result.error);
    updateNodeStatus(node.id, 'error');
  }

  // Update usage stats
  updateNodeMetadata(node.id, {
    tokens: context.getMetadata().totalTokens,
    duration: context.getMetadata().duration,
  });

  return result;
}
```

### Node Status Updates

```javascript
function updateNodeStatus(nodeId, status) {
  // Update your visual node's status indicator
  // status: 'idle' | 'processing' | 'completed' | 'error'
  setNodes(nodes =>
    nodes.map(node =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, status } }
        : node
    )
  );
}

function updateNodeOutput(nodeId, output) {
  // Update your visual node's output display
  setNodes(nodes =>
    nodes.map(node =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, output } }
        : node
    )
  );
}
```

## Environment Setup

Your `.env.local` file should contain:

```env
OPENAI_API_KEY=sk-...
```

## Running Tests

```bash
cd apps/web
node src/app/workflow-example/_library/test.mjs
```

## File Structure

```
apps/web/src/app/workflow-example/_library/
├── openai-workflow.mjs      # Main library
├── examples.mjs             # Usage examples
├── index.mjs                # Export shortcuts
├── test.mjs                 # Test suite
├── openai-workflow.d.ts     # TypeScript definitions
├── README.md                # Full documentation
├── TEST_RESULTS.md          # Test results
└── QUICKSTART.md            # This file
```

## Node Types Supported

1. **Text Generation Node**
   - Input: Prompt text
   - Output: Generated text
   - Config: model, temperature, maxTokens, systemPrompt

2. **Streaming Text Node**
   - Input: Prompt text
   - Output: Streamed text (real-time)
   - Config: model, temperature, callbacks

3. **Structured Data Node**
   - Input: Prompt text
   - Output: JSON object matching schema
   - Config: schema (Zod), model

4. **Embedding Node**
   - Input: Text
   - Output: Vector array
   - Config: model, dimensions

5. **Semantic Search Node**
   - Input: Query text + documents
   - Output: Ranked results
   - Config: topK, model

## Cost Tracking

```javascript
const context = new WorkflowContext();

// ... run your workflows with context ...

const metadata = context.getMetadata();
console.log(`Total tokens used: ${metadata.totalTokens}`);
console.log(`Total duration: ${metadata.duration}ms`);
console.log(`Nodes executed: ${metadata.nodeExecutions}`);

// Estimate cost (gpt-4o-mini: $0.15 per 1M input, $0.60 per 1M output)
const estimatedCost = (metadata.totalTokens / 1000000) * 0.375; // Average
console.log(`Estimated cost: $${estimatedCost.toFixed(4)}`);
```

## Best Practices

1. **Always use WorkflowContext** for multi-node workflows
2. **Handle errors gracefully** - check `result.success`
3. **Use streaming** for better UX in chat interfaces
4. **Batch embeddings** when processing multiple texts
5. **Set timeouts** for long-running operations
6. **Monitor token usage** to control costs
7. **Cache embeddings** for repeated searches

## Next Steps

1. ✅ Library is ready to use
2. ✅ Start integrating with your visual node interface
3. ✅ Implement basic nodes first (text, streaming, structured)
4. ✅ Add embeddings and search later
5. ⚠️ Tool calling can be added when SDK compatibility is resolved

## Support

- See **README.md** for full API documentation
- See **examples.mjs** for more usage patterns
- See **TEST_RESULTS.md** for test coverage details
- AI SDK docs: https://ai-sdk.dev/docs/introduction

## Ready to Integrate! 🚀

The library is tested and ready for visual interface integration. Start with basic text generation nodes and expand from there.

# Workflow AI Enhancement Summary

## Overview

The `@repo/workflows-ai` package has been significantly enhanced with a **node-based architecture** that allows building complex AI workflows with proper input/output connections, real-time streaming, and flexible composition patterns.

## Architecture

### 1. **Original System** (Still Available)
- **Workflow Orchestrators**: Pre-built workflows (sequential, parallel, conditional, retry, complex)
- **Workflow Steps**: Individual AI operations with 'use step' directive
- **Use Case**: Quick, pre-defined workflow patterns

### 2. **New Node-Based System** (Added)
- **Workflow Nodes**: Reusable, connectable building blocks
- **Workflow Graph**: Manages node execution in topological order
- **Workflow Builder**: Fluent API for constructing workflows
- **Use Case**: Custom, complex workflows with fine-grained control

---

## Node Types

### Core AI Nodes

#### 1. **TextGenNode**
- Generates text using AI models
- Supports streaming with `onChunk` callback
- Configurable: model, temperature, systemPrompt
```javascript
const textGen = new TextGenNode('summarize', {
  prompt: 'Summarize: {{input}}',
  model: 'gpt-4o-mini',
  temperature: 0.3
});
```

#### 2. **StructuredDataNode**
- Extracts structured data using Zod schemas
- Returns typed objects
```javascript
const extract = new StructuredDataNode('extract', {
  schema: z.object({
    keywords: z.array(z.string()),
    category: z.string()
  }),
  model: 'gpt-4o-mini'
});
```

### Utility Nodes

#### 3. **InputNode**
- Provides initial data to workflow
- Entry point for data flow

#### 4. **TransformNode**
- Applies custom transformations
- Pure data processing (non-AI)
```javascript
const transform = new TransformNode('format', (data) => {
  return JSON.stringify(data.keywords);
});
```

#### 5. **TemplateNode**
- Creates prompts from templates
- Supports variable substitution with `{{variable}}`
```javascript
const template = new TemplateNode('prompt',
  'Translate to {{language}}: {{input}}'
);
```

#### 6. **MergeNode**
- Combines outputs from multiple nodes
- Strategies: 'object', 'array', 'concat'
```javascript
const merge = new MergeNode('combine', 'object');
```

#### 7. **ConditionNode**
- Routes based on conditions
- Enables branching logic
```javascript
const condition = new ConditionNode('check', (data) => {
  return data.length > 100;
});
```

#### 8. **OutputNode**
- Collects final workflow output
- Terminal node

---

## Workflow Builder API

### Fluent API Pattern

```javascript
import { createWorkflow } from '@repo/workflows-ai';

const workflow = createWorkflow();

workflow
  .input("AI is transforming software development")
  .textGen({
    prompt: data => `Summarize: ${data}`,
    temperature: 0.3
  })
  .extract(z.object({
    keywords: z.array(z.string()),
    sentiment: z.enum(['positive', 'negative', 'neutral'])
  }))
  .transform(data => data.keywords.join(', '))
  .textGen({
    prompt: keywords => `Create a title with: ${keywords}`
  })
  .output();

// Execute with streaming
const results = await workflow.run({
  sendUpdate: (type, data) => console.log(type, data)
});
```

### Pre-Built Templates

#### 1. **Content Pipeline**
Summarize → Extract Keywords → Generate Title

```javascript
import { WorkflowTemplates } from '@repo/workflows-ai';

const workflow = WorkflowTemplates.contentPipeline(
  "Your input text here",
  "gpt-4o-mini"
);
```

#### 2. **Translation Pipeline**
Parallel translations to multiple languages

```javascript
const workflow = WorkflowTemplates.translationPipeline(
  "Hello, how are you?",
  ['French', 'Spanish', 'German']
);
```

#### 3. **Analysis Pipeline**
Technical + Business analysis → Synthesis

```javascript
const workflow = WorkflowTemplates.analysisPipeline(
  "Cloud computing description",
  "gpt-4o-mini"
);
```

#### 4. **Moderation Pipeline**
Content analysis → Safety check → Routing

```javascript
const workflow = WorkflowTemplates.moderationPipeline(
  "User content to moderate"
);
```

---

## Node Connections & Data Flow

### Connecting Nodes

```javascript
// Manual connection
const input = new InputNode('start', "data");
const textGen = new TextGenNode('gen', { prompt: "..." });
const output = new OutputNode('end');

input.connectTo(textGen, 'default', 'prompt');
textGen.connectTo(output);

// Fluent API (automatic)
workflow
  .input("data")
  .textGen({ prompt: "..." })
  .output();
```

### Input/Output Keys

Nodes can have multiple inputs/outputs:

```javascript
const merge = new MergeNode('merge', 'object');

node1.connectTo(merge, 'default', 'input1');
node2.connectTo(merge, 'default', 'input2');
node3.connectTo(merge, 'default', 'input3');
```

### Data Passing

- **Automatic**: Previous node's result becomes next node's input
- **Type Preservation**: Objects, strings, arrays passed as-is
- **Transformations**: Use TransformNode to reshape data

```javascript
workflow
  .input({ name: "Alice", age: 30 })
  .template("Describe {{name}} who is {{age}} years old")
  .textGen({ temperature: 0.7 })
  .transform(result => result.text.toUpperCase())
  .output();
```

---

## Streaming & Real-Time Updates

All nodes support streaming via the `sendUpdate` callback in execution context:

```javascript
const results = await workflow.run({
  sendUpdate: async (type, data) => {
    switch (type) {
      case 'start':
        console.log('Workflow started');
        break;
      case 'progress':
        console.log(`Node ${data.nodeId}: ${data.step}`);
        break;
      case 'text-chunk':
        console.log(`Streaming: ${data.chunk}`);
        break;
      case 'node-complete':
        console.log(`Node ${data.nodeId} complete`);
        break;
      case 'complete':
        console.log('Workflow complete', data.results);
        break;
    }
  }
});
```

### Event Types

- `start` - Workflow execution begins
- `progress` - Node execution status
- `text-chunk` - Streaming text generation (token-by-token)
- `node-complete` - Node finished execution
- `condition-evaluated` - Condition node result
- `complete` - Workflow finished
- `error` - Error occurred

---

## Advanced Patterns

### Parallel Execution

```javascript
const workflow = createWorkflow();
const input = workflow.input("Analyze this");

// Create parallel branches
const branch1 = workflow.input("Analyze this")
  .textGen({ prompt: "Technical analysis" });

const branch2 = workflow.input("Analyze this")
  .textGen({ prompt: "Business analysis" });

const branch3 = workflow.input("Analyze this")
  .textGen({ prompt: "User perspective" });

// Merge results
input.merge([branch1, branch2, branch3], 'concat')
  .textGen({ prompt: data => `Synthesize: ${data}` })
  .output();
```

### Conditional Branching

```javascript
workflow
  .input("Some text...")
  .condition(data => data.length > 100)
  .textGen({
    // Config based on condition
    prompt: data => data.condition
      ? `Summarize: ${data.data}`
      : `Expand: ${data.data}`
  })
  .output();
```

### Multi-Stage Processing

```javascript
workflow
  .input("Raw data")
  // Stage 1: Extract
  .extract(z.object({ facts: z.array(z.string()) }))
  // Stage 2: Transform
  .transform(data => ({
    text: data.data.facts.join('\n'),
    count: data.data.facts.length
  }))
  // Stage 3: Generate
  .template("Create a report from {{count}} facts:\n{{text}}")
  .textGen({ temperature: 0.5 })
  // Stage 4: Refine
  .textGen({
    prompt: result => `Polish this report: ${result.text}`,
    temperature: 0.3
  })
  .output();
```

---

## API Integration

### REST API Endpoint

`POST /api/workflows/builder`

```typescript
// Request
{
  "template": "contentPipeline",  // or "translationPipeline", "analysisPipeline"
  "input": "Your text here",
  "model": "gpt-4o-mini"
}

// Response: Server-Sent Events (SSE)
data: {"type":"start","data":{...},"timestamp":...}\n\n
data: {"type":"progress","data":{...},"timestamp":...}\n\n
data: {"type":"text-chunk","data":{...},"timestamp":...}\n\n
data: {"type":"node-complete","data":{...},"timestamp":...}\n\n
data: {"type":"complete","data":{...},"timestamp":...}\n\n
```

### Client Usage

```typescript
const response = await fetch('/api/workflows/builder', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    template: 'contentPipeline',
    input: 'AI is revolutionizing software development...',
    model: 'gpt-4o-mini'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Parse SSE events and update UI
}
```

---

## Comparison: Original vs Node-Based

| Feature | Original Workflows | Node-Based Workflows |
|---------|-------------------|---------------------|
| **Ease of Use** | ✅ Very simple | ⚠️ Moderate (more flexible) |
| **Customization** | ⚠️ Limited | ✅ Highly customizable |
| **Data Flow** | 🔄 Linear/preset | 🔀 Graph-based, any pattern |
| **Reusability** | ❌ Workflows only | ✅ Individual nodes |
| **Composition** | ❌ Fixed patterns | ✅ Mix & match nodes |
| **Visualization** | ⚠️ Implicit | ✅ Explicit graph structure |
| **Testing** | ⚠️ Workflow level | ✅ Node level |
| **Streaming** | ✅ Yes | ✅ Yes, per-node |

---

## Migration Guide

### From Original Workflows

**Before (Sequential Workflow):**
```javascript
import { sequentialWorkflow } from '@repo/workflows-ai';

const result = await sequentialWorkflow({
  input: "text",
  model: "gpt-4o-mini"
});
```

**After (Node-Based):**
```javascript
import { createWorkflow } from '@repo/workflows-ai';

const workflow = createWorkflow();
workflow
  .input("text")
  .textGen({ prompt: "Summarize: ...", temperature: 0.3 })
  .extract(schema)
  .textGen({ prompt: "Create title..." })
  .output();

const results = await workflow.run({ sendUpdate });
```

### Benefits of Migration

1. **Custom Steps**: Add your own processing logic
2. **Branch Control**: Decide exactly where data flows
3. **Node Reuse**: Share nodes across workflows
4. **Fine-Grained Streaming**: Per-node progress updates
5. **Testing**: Test individual nodes in isolation

---

## TypeScript Support

Full TypeScript definitions for all nodes, builders, and configurations:

```typescript
import type {
  WorkflowNode,
  TextGenNode,
  StructuredDataNode,
  WorkflowBuilder
} from '@repo/workflows-ai';

const workflow: WorkflowBuilder = createWorkflow();

const result = await workflow
  .input<string>("data")
  .textGen({ /* ... */ })
  .extract<{ keywords: string[] }>(schema)
  .output();
```

---

## Best Practices

### 1. **Use Templates for Common Patterns**
Start with `WorkflowTemplates` for standard use cases, then customize.

### 2. **Name Your Nodes**
```javascript
.textGen({ /* config */ }, 'summarizer')  // ✅ Good
.textGen({ /* config */ })                 // ⚠️ Auto-generated ID
```

### 3. **Handle Errors Gracefully**
Nodes throw errors - wrap execution in try/catch.

### 4. **Stream for UX**
Always provide `sendUpdate` callback for real-time feedback.

### 5. **Transform Data Between Nodes**
Use TransformNode when AI output format doesn't match next node's input.

### 6. **Test Nodes Individually**
Create small workflows to test individual node behavior.

---

## Future Enhancements

- [ ] Visual workflow editor UI
- [ ] Workflow persistence to database
- [ ] Resume workflows from checkpoints
- [ ] Workflow versioning
- [ ] A/B testing different node configurations
- [ ] Caching layer for expensive nodes
- [ ] Parallel node execution optimization
- [ ] Workflow analytics dashboard

---

## Examples in Code

See `/apps/web/src/app/demos/workflows` for working examples using the original system.

New workflow builder examples coming to `/apps/web/src/app/demos/builder`.

---

## Summary

The workflows-ai package now supports **two approaches**:

1. **Original**: Quick, pre-defined patterns (sequential, parallel, etc.)
2. **Node-Based**: Flexible, composable, graph-based workflows

Both support:
- ✅ Real-time streaming
- ✅ AI model selection
- ✅ Error handling
- ✅ TypeScript
- ✅ SSE integration

Choose based on your needs:
- **Simple use case?** → Use original workflows
- **Custom flow needed?** → Use node-based system
- **Best of both?** → Start with templates, extend with nodes

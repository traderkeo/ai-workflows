# @repo/nodes-ai

Visual node-based AI workflow builder with a cyberpunk-gothic aesthetic, powered by React Flow.

## Features

- 🎨 **Cyberpunk-Gothic Theme** - Neon accents, dark backgrounds, and glowing effects
- 🔗 **Visual Workflow Editor** - Drag-and-drop node-based interface
- 🤖 **AI-Powered Nodes** - Text generation, structured data, embeddings, and more
- 💾 **Persistent State** - Auto-save, export/import workflows
- ⚡ **Real-time Execution** - Watch your workflow execute with live status updates
- 🔄 **State Management** - Built with Zustand for efficient state handling

## Installation

```bash
pnpm add @repo/nodes-ai
```

## Quick Start

```tsx
import { WorkflowBuilder } from '@repo/nodes-ai';
import '@repo/nodes-ai/styles';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <WorkflowBuilder />
    </div>
  );
}
```

## Node Types

### Input Node
Entry point for your workflow. Supports various data types:
- String
- Number
- Object
- Array

### Text Generation Node
Generate text using OpenAI models with configurable:
- Prompt
- Model selection (GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo)
- Temperature
- Max tokens
- System prompt

### Structured Data Node
Generate structured data with schema validation:
- Define schemas using Zod
- Control output format
- Type-safe results

### Transform Node
Transform data using custom JavaScript code:
- Access input via `input` variable
- Write custom transformation logic
- Return transformed data

### Output Node
Display workflow results with formatted output.

## Usage

### Basic Workflow

1. **Right-click** on the canvas to open the context menu
2. **Select a node type** to add it to the canvas
3. **Connect nodes** by dragging from output handles to input handles
4. **Configure nodes** by editing their properties
5. **Execute** the workflow using the Execute button

### Saving & Loading

- **Export**: Download your workflow as JSON
- **Import**: Load a previously saved workflow
- **Auto-save**: Workflows are automatically saved to localStorage

### Execution

The execution engine:
- Validates the workflow before execution
- Executes nodes in topological order (respecting dependencies)
- Handles parallel execution where possible
- Updates node status in real-time
- Captures errors and displays them on nodes

## Advanced Features

### Custom Node Types

Create your own node types by extending `BaseAINode`:

```tsx
import { BaseAINode } from '@repo/nodes-ai';
import { NodeProps } from '@xyflow/react';

export const CustomNode: React.FC<NodeProps<CustomNodeData>> = (props) => {
  return (
    <BaseAINode {...props} icon={<YourIcon />}>
      {/* Your custom content */}
    </BaseAINode>
  );
};
```

### State Management

Access the flow store directly:

```tsx
import { useFlowStore } from '@repo/nodes-ai';

const MyComponent = () => {
  const { nodes, edges, updateNode } = useFlowStore();

  // Manipulate workflow state
};
```

### Execution Engine

Execute workflows programmatically:

```tsx
import { executeWorkflow, validateWorkflow } from '@repo/nodes-ai';

// Validate before execution
const validation = validateWorkflow(nodes, edges);
if (validation.valid) {
  await executeWorkflow(nodes, edges, (nodeId, updates) => {
    // Handle node updates
  });
}
```

## Styling

The package includes a comprehensive cyberpunk-gothic theme with:

- Custom CSS variables for easy customization
- Neon glow effects
- Animated edges
- Status-based node coloring
- Dark mode optimized

### CSS Variables

Customize the theme by overriding these CSS variables:

```css
:root {
  --cyber-neon-purple: #b026ff;
  --cyber-neon-cyan: #00f0ff;
  --cyber-neon-magenta: #ff00ff;
  --gothic-black: #0a0a0f;
  --gothic-charcoal: #15151f;
  /* ... more variables */
}
```

## Integration

### With ai-workers

All AI operations are powered by `@repo/ai-workers`:

```tsx
import { generateTextNode, WorkflowContext } from '@repo/ai-workers';
```

### With workflows-ai

For durable workflows, combine with `@repo/workflows-ai`:

```tsx
import { textGenerationStep } from '@repo/workflows-ai';
```

## API Reference

### Components

- `WorkflowBuilder` - Main component with ReactFlowProvider
- `WorkflowCanvas` - Canvas with controls and panels
- `ContextMenu` - Right-click menu for adding nodes
- `BaseAINode` - Base component for creating custom nodes

### Hooks

- `useFlowStore` - Zustand store for workflow state

### Utilities

- `executeWorkflow` - Execute a workflow
- `validateWorkflow` - Validate workflow structure

## Development

```bash
# Install dependencies
pnpm install

# Type check
pnpm type-check

# Build
pnpm build
```

## License

MIT

## Credits

Built with:
- [React Flow](https://reactflow.dev/) - Node-based UI library
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Lucide React](https://lucide.dev/) - Icons
- [@repo/ai-workers](../ai-workers) - AI operations
- [@repo/workflows-ai](../workflows-ai) - Durable workflows

# @repo/nodes-ai

Visual node-based AI workflow builder with a cyberpunk‑gothic aesthetic, powered by React Flow.

## Features

- 🎨 **Cyberpunk-Gothic Theme** - Neon accents, dark backgrounds, and glowing effects
- 🔗 **Visual Workflow Editor** - Drag-and-drop node-based interface
- 🤖 **AI-Powered Nodes** - Generate (text + structured), Image, Audio TTS, Agent v6, and more
- 💾 **Persistent State** - Auto-save, export/import workflows
- ⚡ **Real-time Execution** - Watch your workflow execute with live status updates
- 🔄 **State Management** - Built with Zustand for efficient state handling
- 🧭 **Model Selector** - Searchable models with rich capability badges; supports Together model IDs
- 🔌 **Custom Tools** - Agent node can call built-ins (search/calculator/datetime) and your webhooks

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

## Node Types (Core)

### Input Node
Entry point for your workflow. Supports various data types:
- String
- Number
- Object
- Array

### Generate (Text + Structured)
Unified node for text generation and structured output.
- Prompt, System prompt, Temperature, Max tokens
- Mode: `text` or `structured`
- Visual schema builder for structured output
- Uses the searchable Model Selector (OpenAI, Anthropic, Google, and Together IDs)

### Image Generation
Create, edit, or vary images.
- OpenAI models (DALL·E 3, DALL·E 2, GPT‑Image‑1) and Together image models (enter model ID)
- Size, count, quality, style
- Together extras: steps, seed, negative_prompt, aspect_ratio, image_url, loras, safety toggle
- Supports variable‑based source/sidecar images in edit/variation modes

### Audio TTS
Text‑to‑speech with OpenAI TTS models.
- Model, voice, speed
- Streams or returns audio; renderable inline

### AI Agent (v6)
Build agents with tool calling and optional reasoning traces.
- Model Selector, System Instructions, Prompt, Temperature/Max tokens
- Built‑in tools: calculator, search, dateTime
- Custom tools: name/description/parameters JSON + optional webhook URL
- Streaming output + per‑step tool events; optional Reasoning Traces panel
- Multi‑turn: add user messages; optional auto‑append assistant replies

### Video Generation (scaffold)
UI scaffold for future workers‑ai video generation integration.

### Rerank (scaffold)
UI scaffold to preview inputs for future rerank integration.

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

## Model Selector

The Model Selector appears in the Generate, Image Generation, Audio TTS, and Agent nodes.
- Search by id/name/provider/description
- Shows provider badge + capability chips (text/structured/vision/json/tool‑calling/reasoning)
- Displays context length, max tokens, and image pricing hints (when available)
- To use Together, paste a model ID (contains `/`) like `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo`

## Agent v6: Streaming and Tools

Server endpoints (Next.js app):
- `POST /api/workflows/agent`
  - Body: `{ prompt, model?, temperature?, systemPrompt?, messages?, tools?, customTools? }`
  - Returns: `{ success, text, toolCalls, usage }`
- `POST /api/workflows/agent/stream`
  - Body: same as above plus `reasoning?: boolean`
  - SSE events:
    - `{ delta }` incremental text
    - `{ step, toolCalls }` after a tool step
    - `{ reasoningDelta }` when enabled and available
    - `{ done, text, usage }` when complete

Built‑in tools come from `@repo/ai-workers` (search, calculator, dateTime). Custom tools can be added in the node and are executed server‑side:
- If a custom tool has a `endpointUrl` and it is allowlisted, the server will POST `{"tool":"name","args":{...}}` to the webhook and return the JSON response to the agent.
- Otherwise, the server returns an echo payload for development.

Environment:
- `TOOL_WEBHOOK_ALLOWLIST`: comma‑separated origins or hostnames allowed for webhooks.
  - Example: `TOOL_WEBHOOK_ALLOWLIST=https://api.example.com,example.org`

Reasoning traces:
- Turn on “Streaming” and “Show Reasoning” in the Agent node to display `{reasoningDelta}` events when the underlying provider/SDK surfaces them (e.g., certain reasoning‑capable models). This is strictly opt‑in.

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

### UI Components

- Buttons, Inputs, Selects, Tabs are shadcn-inspired primitives under `src/components/ui/*`.
- Switch and StatusBadge components are available for boolean toggles and execution status footers.
- Use `StatusBadge` + `executionTime` in node footers for consistent telemetry.

### Typography

- Typeface: Geist Sans and Geist Mono (with sensible fallbacks).
- Defaults are applied via CSS variables; components avoid inline styles where possible.
- For code blocks and templating, prefer the mono ramp at 13px.

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

Together.ai support:
- The workers library integrates Together chat and image APIs.
- Set `TOGETHER_API_KEY` (and optional `TOGETHER_BASE_URL`) in the environment hosting your API routes.

### With workflows-ai

For durable workflows, combine with `@repo/workflows-ai`:

```tsx
import { textGenerationStep } from '@repo/workflows-ai';
```

## API Reference

### Components

- `WorkflowBuilder` – Main component with ReactFlowProvider
- `WorkflowCanvas` – Canvas with controls and panels
- `ContextMenu` – Right‑click menu for adding nodes
- `BaseAINode` – Base component for creating custom nodes
- Nodes included: `Start`, `Stop`, `Generate`, `ImageGeneration`, `AudioTTS`, `AIAgent (v6)`, `VideoGeneration (scaffold)`, `Rerank (scaffold)`, `Template`, `Transform`, `Condition`, `Merge`, `Loop`, `Cache`, `Guardrail`, `WebScrape`, `DocumentIngest`, `RetrievalQA`, `WebSearch`

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
- [@repo/ai-workers](../ai-workers) - AI operations + Together integration
- [@repo/workflows-ai](../workflows-ai) - Durable workflows

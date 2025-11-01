# nodes-ai Architecture

## Overview

`@repo/nodes-ai` is a comprehensive visual node-based AI workflow builder that combines React Flow's powerful graph editing capabilities with the AI operations from `@repo/ai-workers` and the workflow patterns from `@repo/workflows-ai`.

## Core Architecture

### 1. Component Layer

#### WorkflowBuilder
- **Purpose**: Main entry point component
- **Features**:
  - Wraps everything in `ReactFlowProvider`
  - Manages context menu state
  - Handles right-click interactions
  - Provides viewport context

#### WorkflowCanvas
- **Purpose**: Main canvas for workflow editing
- **Features**:
  - React Flow integration
  - Controls (zoom, fit view, etc.)
  - MiniMap for navigation
  - Action panels (Execute, Save, Load, Reset)
  - Background grid pattern
  - Workflow metadata display

#### BaseAINode
- **Purpose**: Base component for all node types
- **Features**:
  - Consistent visual styling
  - Status indicators (idle, running, success, error, warning)
  - Input/output handles
  - Header with icon and title
  - Body content area
  - Footer with execution time
  - Error display

#### ContextMenu
- **Purpose**: Right-click menu for adding nodes
- **Features**:
  - Node templates with icons
  - Position-aware placement
  - Canvas coordinate conversion
  - Click-outside to close

### 2. Node Types

Each node type is a specialized React component:

#### InputNode
- Entry point for workflows
- Supports multiple value types (string, number, object, array)
- Editable value field
- No input handle, only output

#### OutputNode
- Displays workflow results
- Formatted output display
- JSON pretty-printing for objects
- No output handle, only input

#### TextGenerationNode
- AI text generation using OpenAI
- Configurable model selection
- Temperature and token controls
- System prompt support
- Displays results and token usage

#### StructuredDataNode
- Generates structured data with schemas
- Schema name and description
- Model and temperature controls
- JSON result display
- Token usage tracking

#### TransformNode
- JavaScript code transformation
- Code editor with syntax hints
- Access to input variable
- Result preview

### 3. State Management (Zustand Store)

#### FlowStore Structure
```typescript
{
  // Core state
  nodes: AINode[]
  edges: AIEdge[]
  viewport: { x, y, zoom }
  metadata: WorkflowMetadata
  executionContext: ExecutionContext | null
  isExecuting: boolean

  // Actions
  setNodes, setEdges
  onNodesChange, onEdgesChange, onConnect
  addNode, updateNode, deleteNode
  deleteEdge
  setViewport
  saveWorkflow, loadWorkflow
  exportWorkflow, importWorkflow
  resetWorkflow
  updateMetadata
  startExecution, stopExecution
}
```

#### Persistence
- Uses `zustand/middleware/persist`
- Stores to localStorage under `ai-workflow-storage`
- Persists: nodes, edges, viewport, metadata
- Excludes: executionContext, isExecuting

### 4. Execution Engine

#### Workflow Execution Flow

1. **Validation Phase**
   - Check for Input and Output nodes
   - Detect disconnected nodes
   - Detect circular dependencies
   - Return validation errors

2. **Dependency Graph Construction**
   - Build graph from edges
   - Map node dependencies
   - Create execution order

3. **Topological Execution**
   - Find nodes with no dependencies
   - Execute ready nodes in parallel
   - Update executed set
   - Repeat until all nodes processed

4. **Node Execution**
   - Set status to "running"
   - Gather inputs from connected nodes
   - Execute node-specific logic
   - Update node with results
   - Set status to "success" or "error"
   - Track execution time

#### Supported Node Operations

- **Input**: Return configured value
- **Text Generation**: Call `generateTextNode` from ai-workers
- **Structured Data**: Call `generateStructuredDataNode` from ai-workers
- **Transform**: Execute JavaScript code with Function constructor
- **Output**: Pass through input value

### 5. Type System

#### Type Hierarchy
```
AINodeType (union of node type strings)
  ↓
BaseNodeData (common fields)
  ↓
Specific node data types (TextGenerationNodeData, etc.)
  ↓
AINodeData (union of all node data)
  ↓
AINode (Node<AINodeData, AINodeType>)
```

#### Key Types
- `NodeStatus`: idle | running | success | error | warning
- `ExecutionContext`: Runtime execution state
- `WorkflowMetadata`: Workflow information
- `SavedWorkflow`: Serialized workflow format

### 6. Styling System

#### CSS Architecture
- CSS Custom Properties for theming
- BEM-like naming for components
- Status-based styling
- Cyberpunk color palette
- Gothic dark backgrounds
- Animated effects

#### Key Style Features
- Neon glow effects on nodes and edges
- Status-based border colors
- Pulse animations for running/error states
- Grid background pattern
- Custom fonts (Orbitron, Share Tech Mono)
- Responsive design

### 7. Integration Points

#### With @repo/ai-workers
```typescript
import {
  generateTextNode,
  generateStructuredDataNode,
  WorkflowContext
} from '@repo/ai-workers';
```

Used for:
- Text generation
- Structured data generation
- Workflow context management

#### With @repo/workflows-ai
Currently not directly integrated, but compatible with:
- Step-based workflow patterns
- Durable execution (future feature)
- Human-in-the-loop (future feature)

#### With React Flow
```typescript
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position
} from '@xyflow/react';
```

## Data Flow

### Adding a Node
```
User right-clicks
  → ContextMenu appears
    → User selects node type
      → New node created with template data
        → addNode action called
          → Store updates nodes array
            → React Flow re-renders
              → Node component mounts
```

### Executing Workflow
```
User clicks Execute
  → Validate workflow
    → Build dependency graph
      → Topological sort
        → For each ready node:
          → Set status: running
            → Execute node logic
              → Update with results
                → Set status: success/error
                  → Mark as executed
                    → Continue until complete
```

### Saving Workflow
```
User clicks Export
  → Call saveWorkflow()
    → Serialize { metadata, flow: { nodes, edges, viewport } }
      → Convert to JSON string
        → Create blob
          → Download file
```

## Extension Points

### Adding New Node Types

1. Create node data type in `types/index.ts`
2. Create node component in `nodes/`
3. Add execution logic in `executionEngine.ts`
4. Register in `WorkflowCanvas` nodeTypes
5. Add template to `ContextMenu`

### Custom Themes

Override CSS variables:
```css
:root {
  --cyber-neon-purple: #custom-color;
  --gothic-black: #custom-color;
}
```

### Custom Execution Logic

Extend `executeNode` function in `executionEngine.ts` with new cases.

## Performance Considerations

1. **Parallel Execution**: Nodes without dependencies execute in parallel
2. **Lazy Loading**: Components load only when needed
3. **Memoization**: React Flow handles node/edge memoization
4. **Persistent Storage**: LocalStorage for workflow persistence
5. **Zustand**: Minimal re-renders with selective subscriptions

## Security Considerations

1. **Code Execution**: Transform nodes use `new Function()` - should sanitize in production
2. **API Keys**: Should be handled server-side in production
3. **Input Validation**: Validate user inputs before execution
4. **XSS Prevention**: Sanitize displayed outputs

## Future Enhancements

### Planned Features
1. **More Node Types**:
   - Tool Calling Node
   - Embedding Node
   - Semantic Search Node
   - Conditional Node
   - Parallel Node
   - Retry Node

2. **Advanced Execution**:
   - Streaming results
   - Abort execution
   - Step-by-step debugging
   - Breakpoints

3. **Collaboration**:
   - Real-time collaboration
   - Workflow sharing
   - Version control
   - Comments and annotations

4. **Integration**:
   - Vercel Workflow SDK integration
   - Durable execution
   - Human-in-the-loop workflows
   - External API connections

5. **UI/UX**:
   - Node search
   - Keyboard shortcuts
   - Undo/redo
   - Node grouping
   - Minimap improvements

## File Structure

```
packages/nodes-ai/
├── src/
│   ├── components/
│   │   ├── BaseAINode.tsx          # Base node component
│   │   ├── ContextMenu.tsx         # Right-click menu
│   │   ├── WorkflowBuilder.tsx     # Main entry component
│   │   └── WorkflowCanvas.tsx      # Canvas with controls
│   ├── nodes/
│   │   ├── InputNode.tsx           # Input node
│   │   ├── OutputNode.tsx          # Output node
│   │   ├── TextGenerationNode.tsx  # Text generation
│   │   ├── StructuredDataNode.tsx  # Structured data
│   │   └── TransformNode.tsx       # Data transformation
│   ├── hooks/
│   │   └── useFlowStore.ts         # Zustand store
│   ├── utils/
│   │   └── executionEngine.ts      # Workflow execution
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   ├── styles/
│   │   └── index.css               # Cyberpunk-gothic theme
│   └── index.ts                    # Main exports
├── package.json
├── tsconfig.json
├── README.md
├── INTEGRATION.md
└── ARCHITECTURE.md (this file)
```

## Dependencies

- **@xyflow/react**: Node-based UI library
- **zustand**: State management
- **lucide-react**: Icon library
- **@repo/ai-workers**: AI operations
- **@repo/workflows-ai**: Workflow patterns
- **react** & **react-dom**: UI framework
- **zod**: Schema validation

## Development Workflow

1. Install dependencies: `pnpm install`
2. Type check: `pnpm type-check`
3. Build: `pnpm build`
4. Use in apps/web: See INTEGRATION.md

## Testing Strategy

### Unit Tests (Future)
- Node execution logic
- Validation functions
- Dependency graph construction
- State management

### Integration Tests (Future)
- Complete workflow execution
- Save/load functionality
- Node connections
- Error handling

### E2E Tests (Future)
- User workflows
- Canvas interactions
- Export/import
- Real AI execution

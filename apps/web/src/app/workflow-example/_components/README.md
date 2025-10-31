# Workflow Builder Components

This directory contains reusable components for building AI workflow diagrams, similar to n8n or gumloop, specifically designed for multi-step AI text, image, and embedding generation using Vercel's workflow-sdk.

## Structure

```
_components/
├── types.ts              # TypeScript types for workflow nodes and edges
├── NodeFactory.tsx       # Factory component that routes to correct node type
├── WorkflowCanvas.tsx    # Canvas wrapper component
├── ToolbarPanel.tsx      # Toolbar for adding nodes and exporting
└── nodes/
    ├── index.ts          # Node exports
    ├── TextNode.tsx      # Text generation node
    ├── StructuredDataNode.tsx  # Structured data extraction node
    ├── ConditionalNode.tsx     # If/Else/Or branching node
    └── StopNode.tsx      # Stop/terminate path node
```

## Node Types

### 1. Text Node (`TextNode`)
- **Purpose**: Send text, receive text blob response
- **Use Case**: Standard AI text generation workflows
- **Data Type**: `TextNodeData`
- **Properties**:
  - `input`: Input text
  - `output`: Generated text output
  - `status`: 'idle' | 'processing' | 'completed' | 'error'
  - `error`: Error message if failed

### 2. Structured Data Node (`StructuredDataNode`)
- **Purpose**: Send text, receive structured data
- **Use Case**: Extract structured information from unstructured text
- **Data Type**: `StructuredDataNodeData`
- **Properties**:
  - `input`: Input text
  - `schema`: Expected data schema
  - `output`: Extracted structured data
  - `status`: 'idle' | 'processing' | 'completed' | 'error'
  - `error`: Error message if failed

### 3. Conditional Node (`ConditionalNode`)
- **Purpose**: Split workflow path based on conditions (If/Else/Or)
- **Use Case**: Conditional routing and branching logic
- **Data Type**: `ConditionalNodeData`
- **Properties**:
  - `condition`: Main condition expression
  - `branches`: Array of branch conditions with labels
  - `status`: 'idle' | 'evaluating' | 'routed'
- **Features**:
  - Dynamic output handles based on number of branches
  - Each branch gets its own output handle

### 4. Stop Node (`StopNode`)
- **Purpose**: Terminate a workflow path
- **Use Case**: End workflow execution
- **Data Type**: `StopNodeData`
- **Properties**:
  - `reason`: Optional reason for stopping
  - `status`: 'idle' | 'stopped'

## Adding New Node Types

1. **Define the data type** in `types.ts`:
   ```typescript
   export interface MyNewNodeData extends BaseWorkflowNodeData {
     type: 'mynewtype';
     // ... your properties
   }
   ```

2. **Add to union type**:
   ```typescript
   export type WorkflowNodeData = 
     | TextNodeData 
     | StructuredDataNodeData 
     | ConditionalNodeData 
     | StopNodeData
     | MyNewNodeData;  // Add here
   ```

3. **Create component** in `nodes/MyNewNode.tsx`:
   ```typescript
   export function MyNewNode({ data, nodeId, onEdit, onDelete }: MyNewNodeProps) {
     // Your component implementation
   }
   ```

4. **Export from** `nodes/index.ts`

5. **Add to NodeFactory** switch statement

6. **Add to NodeFactory.createNodeTypes** return object

7. **Update ToolbarPanel** to include button for new node type

8. **Update page.tsx** `addNewNode` function to handle new type

## Component Architecture

### NodeFactory
Central routing component that renders the appropriate node component based on `data.type`. This keeps node type logic centralized and makes it easy to add new types.

### WorkflowCanvas
Wrapper around the React Flow Canvas component that provides consistent configuration and edge types.

### ToolbarPanel
Provides UI for:
- Adding new nodes of different types
- Exporting workflow configuration

## Integration with Vercel Workflow SDK

These components are designed to work with Vercel's workflow-sdk. Each node type can be mapped to corresponding workflow steps:

- **TextNode** → `generateText()` calls
- **StructuredDataNode** → `generateObject()` calls  
- **ConditionalNode** → `if/else` workflow conditions
- **StopNode** → `return` or `throw` workflow termination

## Future Enhancements

- Image generation nodes
- Embedding generation nodes
- Loop/iteration nodes
- Delay/wait nodes
- API call nodes
- Data transformation nodes
- Error handling nodes

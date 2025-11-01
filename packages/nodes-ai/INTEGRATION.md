# Integration Guide

## Integrating nodes-ai into apps/web

### Step 1: Add to package.json

```json
{
  "dependencies": {
    "@repo/nodes-ai": "workspace:*"
  }
}
```

### Step 2: Create a Workflow Page

Create `apps/web/src/app/workflow-builder/page.tsx`:

```tsx
'use client';

import { WorkflowBuilder } from '@repo/nodes-ai';
import '@repo/nodes-ai/styles';

export default function WorkflowBuilderPage() {
  return (
    <div className="w-screen h-screen bg-black">
      <WorkflowBuilder />
    </div>
  );
}
```

### Step 3: Add Environment Variables

Ensure your `.env.local` has:

```env
OPENAI_API_KEY=your_api_key_here
```

### Step 4: Create API Routes for Execution

For server-side execution (recommended), create API routes:

#### `apps/web/src/app/api/workflow/execute/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { executeWorkflow } from '@repo/nodes-ai';

export async function POST(request: NextRequest) {
  try {
    const { nodes, edges } = await request.json();

    const results: any[] = [];

    const context = await executeWorkflow(nodes, edges, (nodeId, updates) => {
      results.push({ nodeId, updates });
    });

    return NextResponse.json({
      success: true,
      results,
      context: {
        nodeResults: Array.from(context.nodeResults.entries()),
        errors: Array.from(context.errors.entries()),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Step 5: Update Workflow Canvas for API Execution (Optional)

If you want to execute workflows server-side, modify the WorkflowCanvas:

```tsx
const handleExecute = async () => {
  const validation = validateWorkflow(nodes, edges);
  if (!validation.valid) {
    alert(`Workflow validation failed:\n\n${validation.errors.join('\n')}`);
    return;
  }

  startExecution();

  try {
    const response = await fetch('/api/workflow/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, edges }),
    });

    const data = await response.json();

    if (data.success) {
      // Update nodes with results
      data.results.forEach((result: any) => {
        updateNode(result.nodeId, result.updates);
      });
      alert('Workflow executed successfully!');
    } else {
      alert(`Workflow execution failed: ${data.error}`);
    }
  } catch (error: any) {
    alert(`Workflow execution failed: ${error.message}`);
  } finally {
    stopExecution();
  }
};
```

## Example Workflows

### Simple Text Generation

1. Add an **Input** node with value: "What is AI?"
2. Add a **Text Generation** node
3. Connect Input → Text Generation
4. Add an **Output** node
5. Connect Text Generation → Output
6. Click **Execute**

### Data Transformation Pipeline

1. **Input** node with JSON data
2. **Transform** node to parse/modify data
3. **Structured Data** node to format output
4. **Output** node to display result

### Parallel Processing

1. **Input** node
2. Multiple **Text Generation** nodes (not connected to each other)
3. Connect Input to all Text Generation nodes
4. Multiple **Output** nodes for each result

## Customization

### Custom Theme Colors

Override CSS variables in your global CSS:

```css
:root {
  --cyber-neon-purple: #your-color;
  --cyber-neon-cyan: #your-color;
  --gothic-black: #your-color;
}
```

### Custom Nodes

Create custom node types:

```tsx
import { BaseAINode } from '@repo/nodes-ai';
import type { NodeProps } from '@xyflow/react';

interface CustomNodeData {
  label: string;
  customField: string;
}

export const CustomNode: React.FC<NodeProps<CustomNodeData>> = (props) => {
  return (
    <BaseAINode {...props} icon={<YourIcon />}>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Custom Field</label>
        <input
          className="ai-node-input"
          value={props.data.customField}
          onChange={(e) => updateNode(props.id, { customField: e.target.value })}
        />
      </div>
    </BaseAINode>
  );
};
```

Then register it:

```tsx
const nodeTypes = {
  ...defaultNodeTypes,
  custom: CustomNode,
};

<ReactFlow nodeTypes={nodeTypes} ... />
```

## Tips

1. **Save Often**: Use the Export button to save your workflows
2. **Validate First**: The execution engine validates before running
3. **Check Connections**: Ensure all nodes are properly connected
4. **Monitor Status**: Watch node status indicators during execution
5. **Handle Errors**: Error messages appear directly on failed nodes

## Troubleshooting

### "Schema is required" error
Make sure to define schemas for Structured Data nodes programmatically or via configuration.

### Nodes not executing
- Check that all nodes are connected
- Ensure there's at least one Input and one Output node
- Verify there are no circular dependencies

### Styling issues
- Make sure to import '@repo/nodes-ai/styles'
- Check that your parent container has defined width/height

## Next Steps

- Explore the example workflows
- Create custom node types for your use case
- Integrate with your existing AI infrastructure
- Build reusable workflow templates

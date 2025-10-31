'use client';

import type { NodeProps } from '@xyflow/react';
import { TextNode } from './nodes/TextNode';
import { StructuredDataNode } from './nodes/StructuredDataNode';
import { ConditionalNode } from './nodes/ConditionalNode';
import { StopNode } from './nodes/StopNode';
import type { WorkflowNodeData } from './types';

interface NodeFactoryProps extends NodeProps {
  data: WorkflowNodeData;
  id: string;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

/**
 * Factory component that renders the appropriate node type based on data.type
 */
export function NodeFactory({ 
  data, 
  id, 
  onEdit, 
  onDelete,
  ...props 
}: NodeFactoryProps) {
  switch (data.type) {
    case 'text':
      return (
        <TextNode 
          data={data} 
          nodeId={id} 
          onEdit={onEdit} 
          onDelete={onDelete}
        />
      );
    case 'structured':
      return (
        <StructuredDataNode 
          data={data} 
          nodeId={id} 
          onEdit={onEdit} 
          onDelete={onDelete}
        />
      );
    case 'conditional':
      return (
        <ConditionalNode 
          data={data} 
          nodeId={id} 
          onEdit={onEdit} 
          onDelete={onDelete}
        />
      );
    case 'stop':
      return (
        <StopNode 
          data={data} 
          nodeId={id} 
          onEdit={onEdit} 
          onDelete={onDelete}
        />
      );
    default:
      return (
        <div className="p-4 border border-destructive rounded">
          Unknown node type: {(data as any).type}
        </div>
      );
  }
}

/**
 * Creates the nodeTypes object for React Flow
 */
export function createNodeTypes(
  onEdit?: (nodeId: string) => void,
  onDelete?: (nodeId: string) => void
) {
  return {
    text: (props: NodeProps & { data: WorkflowNodeData; id: string }) => (
      <NodeFactory {...props} onEdit={onEdit} onDelete={onDelete} />
    ),
    structured: (props: NodeProps & { data: WorkflowNodeData; id: string }) => (
      <NodeFactory {...props} onEdit={onEdit} onDelete={onDelete} />
    ),
    conditional: (props: NodeProps & { data: WorkflowNodeData; id: string }) => (
      <NodeFactory {...props} onEdit={onEdit} onDelete={onDelete} />
    ),
    stop: (props: NodeProps & { data: WorkflowNodeData; id: string }) => (
      <NodeFactory {...props} onEdit={onEdit} onDelete={onDelete} />
    ),
  };
}

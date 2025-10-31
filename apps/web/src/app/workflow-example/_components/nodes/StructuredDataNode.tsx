'use client';

import {
  Node,
  NodeContent,
  NodeDescription,
  NodeFooter,
  NodeHeader,
  NodeTitle,
} from '@/components/ai-elements/node';
import { Toolbar } from '@/components/ai-elements/toolbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StructuredDataNodeData } from '../types';
import { useCallback, useState, useEffect, useRef, type MouseEvent } from 'react';

interface StructuredDataNodeProps {
  data: StructuredDataNodeData;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  nodeId: string;
}

export function StructuredDataNode({ 
  data, 
  onEdit, 
  onDelete, 
  nodeId 
}: StructuredDataNodeProps) {
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleEdit = useCallback(() => {
    onEdit?.(nodeId);
  }, [onEdit, nodeId]);

  const handleDelete = useCallback(() => {
    onDelete?.(nodeId);
  }, [onDelete, nodeId]);

  const handleNodeClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-toolbar-control]') || target.closest('.react-flow__handle')) {
      return;
    }
    setIsToolbarVisible((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isToolbarVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const node = nodeRef.current;

      if (
        node &&
        !node.contains(target) &&
        !target.closest('[data-toolbar-control]')
      ) {
        setIsToolbarVisible(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside as any);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside as any);
    };
  }, [isToolbarVisible]);

  const getStatusColor = () => {
    switch (data.status) {
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Node
      ref={nodeRef}
      handles={data.handles}
      className="p-2 min-w-[400px]"
      onClick={handleNodeClick}
    >
      <NodeHeader className="p-2">
        <div className="flex items-center justify-between">
          <div>
            <NodeTitle>{data.label}</NodeTitle>
            <NodeDescription>{data.description}</NodeDescription>
          </div>
          {data.status && (
            <Badge 
              variant="secondary" 
              className={`${getStatusColor()} text-white`}
            >
              {data.status}
            </Badge>
          )}
        </div>
      </NodeHeader>
      <NodeContent>
        <div className="space-y-3">
          {data.input && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Input:</p>
              <p className="text-sm bg-muted p-2 rounded">{data.input}</p>
            </div>
          )}
          {data.schema && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Schema:</p>
              <pre className="text-xs bg-muted p-2 rounded max-h-32 overflow-y-auto">
                {JSON.stringify(data.schema, null, 2)}
              </pre>
            </div>
          )}
          {data.output && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Output:</p>
              <pre className="text-xs bg-muted p-2 rounded max-h-32 overflow-y-auto">
                {JSON.stringify(data.output, null, 2)}
              </pre>
            </div>
          )}
          {data.error && (
            <div>
              <p className="text-xs text-destructive mb-1">Error:</p>
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {data.error}
              </p>
            </div>
          )}
          {!data.input && !data.output && !data.schema && (
            <p className="text-sm text-muted-foreground">
              Configure node to extract structured data from text
            </p>
          )}
        </div>
      </NodeContent>
      <NodeFooter>
        <p className="text-muted-foreground text-xs">
          Type: Structured Data Extraction
        </p>
      </NodeFooter>
      {isToolbarVisible && (
        <Toolbar
          data-toolbar-control
        >
        <Button 
          onClick={handleEdit}
          //@ts-ignore
          size="sm" 
          variant="ghost"
        >
          Edit
        </Button>
        <Button 
          onClick={handleDelete}
          //@ts-ignore
          size="sm" 
          variant="ghost"
        >
          Delete
        </Button>
        </Toolbar>
      )}
    </Node>
  );
}

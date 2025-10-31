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
import type { StopNodeData } from '../types';
import { useCallback, useState, useEffect, useRef, type MouseEvent } from 'react';

interface StopNodeProps {
  data: StopNodeData;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  nodeId: string;
}

export function StopNode({ 
  data, 
  onEdit, 
  onDelete, 
  nodeId 
}: StopNodeProps) {
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

  return (
    <Node
      ref={nodeRef}
      handles={data.handles}
      className="p-2 min-w-[300px]"
      onClick={handleNodeClick}
    >
      <NodeHeader className="p-2">
        <div className="flex items-center justify-between">
          <div>
            <NodeTitle>{data.label}</NodeTitle>
            <NodeDescription>{data.description}</NodeDescription>
          </div>
          {data.status === 'stopped' && (
            <Badge variant="secondary" className="bg-red-500 text-white">
              Stopped
            </Badge>
          )}
        </div>
      </NodeHeader>
      <NodeContent>
        <div className="space-y-3">
          {data.reason && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reason:</p>
              <p className="text-sm bg-muted p-2 rounded">{data.reason}</p>
            </div>
          )}
          {!data.reason && (
            <p className="text-sm text-muted-foreground">
              Workflow path terminates here
            </p>
          )}
        </div>
      </NodeContent>
      <NodeFooter>
        <p className="text-muted-foreground text-xs">
          Type: Stop / Terminate Path
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

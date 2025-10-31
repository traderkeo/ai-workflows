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
import type { ConditionalNodeData } from '../types';
import { useCallback, useState, useEffect, useRef, type MouseEvent } from 'react';
import { Handle, Position } from '@xyflow/react';

interface ConditionalNodeProps {
  data: ConditionalNodeData;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  nodeId: string;
}

export function ConditionalNode({ 
  data, 
  onEdit, 
  onDelete, 
  nodeId 
}: ConditionalNodeProps) {
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
      case 'evaluating':
        return 'bg-blue-500';
      case 'routed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Dynamic handles based on branches
  const branches = data.branches || [
    { id: 'if', label: 'If', condition: 'true' },
    { id: 'else', label: 'Else', condition: 'false' },
  ];

  return (
    <Node
      ref={nodeRef}
      handles={{ target: true, source: false }}
      className="p-2 min-w-[350px] relative"
      onClick={handleNodeClick}
    >
      {/* Input handle */}
      <Handle 
        position={Position.Left} 
        type="target"
        className="cursor-crosshair"
        style={{ 
          background: 'hsl(var(--primary))',
          borderColor: 'hsl(var(--primary-foreground))',
          width: '12px',
          height: '12px',
          borderWidth: '2px',
        }}
      />
      
      {/* Output handles for each branch */}
      {branches.map((branch, index) => {
        // Better spacing for handles - spread them out more evenly
        const totalBranches = branches.length;
        const spacing = totalBranches > 2 ? 25 : 20;
        const handleTop = 25 + index * spacing;
        
        return (
          <div 
            key={branch.id} 
            className="absolute right-0 flex items-center gap-2" 
            style={{ 
              top: `${handleTop}%`, 
              transform: 'translateY(-50%)',
              zIndex: 10,
            }}
          >
            <div 
              className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-background/90 border border-border px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-20"
              style={{ 
                right: '18px',
                transform: 'translateY(-50%)',
              }}
            >
              {branch.label}
            </div>
            <Handle
              position={Position.Right}
              type="source"
              id={branch.id}
              className="relative cursor-crosshair"
              style={{ 
                background: 'hsl(var(--primary))',
                borderColor: 'hsl(var(--primary-foreground))',
                zIndex: 20,
                width: '12px',
                height: '12px',
                borderWidth: '2px',
              }}
            />
          </div>
        );
      })}

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
          {data.condition && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Condition:</p>
              <code className="text-xs bg-muted p-2 rounded block">
                {data.condition}
              </code>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Branches:</p>
            <div className="space-y-1">
              {branches.map((branch) => (
                <div 
                  key={branch.id} 
                  className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded"
                >
                  <Badge variant="outline" className="text-xs">
                    {branch.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {branch.condition}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {!data.condition && branches.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Configure conditions to split workflow paths
            </p>
          )}
        </div>
      </NodeContent>
      <NodeFooter>
        <p className="text-muted-foreground text-xs">
          Type: Conditional Branching
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

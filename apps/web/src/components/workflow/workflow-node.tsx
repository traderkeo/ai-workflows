import { memo } from 'react';
import {
  Node,
  NodeContent,
  NodeDescription,
  NodeHeader,
  NodeTitle,
} from '@/components/ai-elements/node';
import { WorkflowNodeData } from '@/lib/workflow/types';
import { Badge } from '@/components/ui/badge';

interface WorkflowNodeProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

const getNodeColors = (nodeType: string) => {
  switch (nodeType) {
    case 'trigger':
      return {
        border: 'border-green-500/50',
        bg: 'bg-green-950/30',
        badge: 'bg-green-500/20 text-green-300',
      };
    case 'action':
      return {
        border: 'border-blue-500/50',
        bg: 'bg-blue-950/30',
        badge: 'bg-blue-500/20 text-blue-300',
      };
    case 'logic':
      return {
        border: 'border-purple-500/50',
        bg: 'bg-purple-950/30',
        badge: 'bg-purple-500/20 text-purple-300',
      };
    case 'transform':
      return {
        border: 'border-orange-500/50',
        bg: 'bg-orange-950/30',
        badge: 'bg-orange-500/20 text-orange-300',
      };
    default:
      return {
        border: 'border-zinc-500/50',
        bg: 'bg-zinc-950/30',
        badge: 'bg-zinc-500/20 text-zinc-300',
      };
  }
};

export const WorkflowNode = memo(({ data, selected }: WorkflowNodeProps) => {
  const colors = getNodeColors(data.nodeType);

  return (
    <Node
      handles={data.handles}
      className={`
        min-w-[280px] max-w-[320px]
        border-2 ${colors.border}
        ${colors.bg}
        backdrop-blur-xs
        transition-all duration-200
        ${selected ? 'ring-2 ring-white/50 shadow-lg shadow-white/20' : 'shadow-md'}
        hover:shadow-lg hover:shadow-white/10
      `}
    >
      <NodeHeader className="p-3 border-b border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{data.icon}</span>
          <NodeTitle className="text-white font-medium">{data.label}</NodeTitle>
        </div>
        {data.description && (
          <NodeDescription className="text-zinc-400 text-xs mt-1">
            {data.description}
          </NodeDescription>
        )}
      </NodeHeader>

      <NodeContent className="p-3">
        <div className="space-y-2">
          <Badge className={`${colors.badge} text-[10px] font-mono`}>
            {data.nodeType.toUpperCase()}
          </Badge>

          {Object.keys(data.config).length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <div className="text-[10px] text-zinc-500 font-mono space-y-1">
                {Object.entries(data.config).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="truncate">
                    <span className="text-zinc-600">{key}:</span>{' '}
                    <span className="text-zinc-400">
                      {typeof value === 'string'
                        ? value.length > 30
                          ? value.slice(0, 30) + '...'
                          : value
                        : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </NodeContent>
    </Node>
  );
});

WorkflowNode.displayName = 'WorkflowNode';

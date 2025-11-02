import React, { useMemo } from 'react';
import { Database, Copy, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AINode } from '../types';

interface VariablesPanelProps {
  nodes: AINode[];
  selectedNodeId?: string;
}

const PANEL_STORAGE_KEY = 'variables-panel-collapsed';

export const VariablesPanel: React.FC<VariablesPanelProps> = ({ nodes, selectedNodeId }) => {
  const [copiedVar, setCopiedVar] = React.useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(PANEL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify(newState));
    }
  };

  // Get all nodes - show immediately, not just those with output
  const availableVariables = useMemo(() => {
    return nodes
      .filter(node => {
        // Exclude start and stop nodes from variable list
        return node.type !== 'start' && node.type !== 'stop';
      })
      .map(node => {
        const value = node.data.result
          ?? node.data.value
          ?? node.data.streamingText
          ?? node.data.results // For LoopNode
          ?? node.data.conditionMet; // For ConditionNode

        const hasOutput = value !== undefined;

        return {
          nodeId: node.id,
          label: node.data.label || node.type,
          name: node.data.name, // Custom name
          type: node.type,
          value: hasOutput ? value : '(not executed yet)',
          status: node.data.status,
          hasOutput,
        };
      });
  }, [nodes]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVar(text);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return 'null';
    if (typeof value === 'string') {
      return value.length > 100 ? value.substring(0, 100) + '...' : value;
    }
    if (typeof value === 'object') {
      const str = JSON.stringify(value, null, 2);
      return str.length > 100 ? str.substring(0, 100) + '...' : str;
    }
    return String(value);
  };

  const panelWidth = isCollapsed ? 0 : 320;
  const transitionDuration = 200; // ms

  return (
    <div className="relative h-full">
      {/* Collapsed Toggle Button */}
      <button
        onClick={toggleCollapse}
        className={`absolute top-1/2 -translate-y-1/2 z-20 h-12 w-6 rounded-r-md bg-card border border-l-0 border-border shadow-md hover:bg-accent transition-all flex items-center justify-center group ${
          isCollapsed ? 'left-0' : 'left-[320px]'
        }`}
        style={{ transitionDuration: `${transitionDuration}ms`, transitionProperty: 'left' }}
        title={isCollapsed ? 'Show Variables' : 'Hide Variables'}
      >
        {isCollapsed ? (
          <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground" />
        ) : (
          <ChevronLeft size={14} className="text-muted-foreground group-hover:text-foreground" />
        )}
      </button>

      {/* Variables Panel */}
      <div
        className="bg-card border-r border-border h-full flex flex-col overflow-hidden shadow-sm"
        style={{
          width: `${panelWidth}px`,
          transition: `width ${transitionDuration}ms ease-in-out`,
          opacity: isCollapsed ? 0 : 1,
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <Database size={16} className="text-primary" />
            <div>
              <div className="text-sm font-semibold text-foreground">Variables</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                {availableVariables.length} {availableVariables.length !== 1 ? 'items' : 'item'}
              </div>
            </div>
          </div>
          <button
            onClick={toggleCollapse}
            className="p-1 rounded-md hover:bg-accent transition-colors"
            title="Collapse panel"
          >
            <ChevronLeft size={14} className="text-muted-foreground" />
          </button>
        </div>

        {/* Instructions */}
        <div className="px-4 py-2 border-b border-border bg-muted/20">
          <div className="text-xs text-muted-foreground font-mono">
            Click to copy. Use in templates:
          </div>
          <div className="text-xs text-primary font-mono mt-1.5 space-y-0.5">
            <div>{'{{node_name.data}}'} - by name</div>
            <div>{'{{input}}'} - first node</div>
            <div>{'{{label}}'} - by label</div>
          </div>
        </div>

        {/* Variables List */}
        <div className="flex-1 overflow-y-auto p-2">
          {availableVariables.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-muted-foreground font-mono">
              No variables yet.
              <br />
              <span className="text-[10px]">Execute workflow to see outputs</span>
            </div>
          ) : (
            <div className="space-y-2">
              {availableVariables.map((variable) => (
                <div
                  key={variable.nodeId}
                  className={`p-3 rounded-md border transition-all ${
                    selectedNodeId === variable.nodeId
                      ? 'bg-accent border-primary shadow-sm'
                      : 'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  {/* Node Info */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs font-semibold text-foreground">{variable.label}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{variable.type}</div>
                    </div>
                    {variable.status && (
                      <div
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase font-mono ${
                          variable.status === 'success'
                            ? 'bg-green-500/20 text-green-500'
                            : variable.status === 'running'
                            ? 'bg-blue-500/20 text-blue-500'
                            : variable.status === 'error'
                            ? 'bg-red-500/20 text-red-500'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {variable.status}
                      </div>
                    )}
                  </div>

                  {/* Variable References */}
                  <div className="space-y-1.5 mb-2">
                    {/* By Name (if exists) - Primary reference */}
                    {variable.name && (
                      <button
                        onClick={() => copyToClipboard(`{{${variable.name}.data}}`)}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold font-mono rounded border border-green-500/50 bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:border-green-500 transition-all"
                      >
                        {copiedVar === `{{${variable.name}.data}}` ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>{'{{' + variable.name + '.data}}'} <span className="opacity-60">(recommended)</span></span>
                      </button>
                    )}

                    {/* By Label */}
                    <button
                      onClick={() => copyToClipboard(`{{${variable.label}}}`)}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold font-mono rounded border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary transition-all"
                    >
                      {copiedVar === `{{${variable.label}}}` ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>{'{{' + variable.label + '}}'} <span className="opacity-60">(by label)</span></span>
                    </button>

                    {/* By ID (if different from label) */}
                    {variable.nodeId !== variable.label && (
                      <button
                        onClick={() => copyToClipboard(`{{${variable.nodeId}}}`)}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold font-mono rounded border border-purple-500/50 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 hover:border-purple-500 transition-all"
                      >
                        {copiedVar === `{{${variable.nodeId}}}` ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>{'{{' + variable.nodeId + '}}'} <span className="opacity-60">(by id)</span></span>
                      </button>
                    )}
                  </div>

                  {/* Value Preview */}
                  <div className="p-2 bg-muted/50 border border-border rounded text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
                    {formatValue(variable.value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

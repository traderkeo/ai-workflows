import React, { useMemo } from 'react';
import { Database, Copy, CheckCircle2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { AINode, AIEdge } from '../types';
import { useFlowStore } from '../hooks/useFlowStore';
import { getAvailableVariablesWithInfo, type VariableInfo } from '../utils/variableResolver';

interface VariablesPanelProps {
  nodes: AINode[]; // kept for backwards compatibility (unused if store is available)
  selectedNodeId?: string;
  edges?: AIEdge[]; // optional; falls back to store
}

const PANEL_STORAGE_KEY = 'variables-panel-collapsed';

export const VariablesPanel: React.FC<VariablesPanelProps> = ({ nodes, selectedNodeId, edges }) => {
  const [copiedVar, setCopiedVar] = React.useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(PANEL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  // Prefer Zustand store nodes/edges for consistency across the app
  const storeNodes = useFlowStore((s) => s.nodes);
  const storeEdges = useFlowStore((s) => s.edges);
  const effectiveNodes = storeNodes?.length ? (storeNodes as AINode[]) : nodes;
  const effectiveEdges = (edges && edges.length ? edges : storeEdges) as AIEdge[];

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify(newState));
    }
  };

  // Context-aware variables (upstream of the selected node), mirrors AIAgentSettingsDialog
  const contextVariables: VariableInfo[] = useMemo(() => {
    if (!selectedNodeId) return [];
    try {
      return getAvailableVariablesWithInfo(selectedNodeId, effectiveNodes as any, effectiveEdges as any);
    } catch {
      return [];
    }
  }, [selectedNodeId, effectiveNodes, effectiveEdges]);

  // Fallback: global simple list (legacy)
  const legacyVariables = useMemo(() => {
    return effectiveNodes
      .filter((node) => node.type !== 'start' && node.type !== 'stop')
      .map((node) => {
        const value = node.data.result
          ?? node.data.value
          ?? node.data.streamingText
          ?? node.data.results
          ?? node.data.conditionMet;
        const hasOutput = value !== undefined;
        return {
          nodeId: node.id,
          label: node.data.label || node.type,
          name: node.data.name as string | undefined,
          value: hasOutput ? value : '(not executed yet)'
        };
      });
  }, [effectiveNodes]);

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

  const panelWidth = isCollapsed ? 0 : 340;
  const transitionDuration = 200; // ms

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'audio':
        return '🔊';
      case 'text':
        return '📝';
      case 'number':
        return '🔢';
      case 'boolean':
        return '✓';
      case 'array':
        return '📋';
      case 'object':
        return '{}';
      default:
        return '📄';
    }
  };

  return (
    <div className="relative h-full">
      {/* Collapsed Toggle Button */}
      <button
        onClick={toggleCollapse}
        className={`absolute top-1/2 -translate-y-1/2 z-20 h-12 w-6 rounded-r-md bg-card border border-l-0 border-border shadow-md hover:bg-accent transition-all flex items-center justify-center group ${
          isCollapsed ? 'left-0' : 'left-[340px]'
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
              {selectedNodeId ? (
                <div className="text-xs text-muted-foreground font-mono mt-0.5">
                  {contextVariables.length} available upstream
                </div>
              ) : (
                <div className="text-xs text-muted-foreground font-mono mt-0.5">
                  {legacyVariables.length} nodes
                </div>
              )}
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
            <div>{'{{input}}'} - first connected input</div>
            <div>{'{{nodeName}}'} - by name/label/id</div>
            <div>{'{{nodeName.prop}}'} - nested property</div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto">
          {selectedNodeId ? (
            contextVariables.length === 0 ? (
              <div className="p-4 text-xs text-muted-foreground">
                No upstream variables. Connect nodes to provide inputs.
              </div>
            ) : (
              <div className="px-3 py-2">
                <div
                  style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color, #333)',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {contextVariables.map((v, idx) => (
                    <div
                      key={`${v.nodeId}-${v.variable}`}
                      style={{
                        padding: '10px 12px',
                        borderBottom: idx < contextVariables.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ fontSize: '16px', lineHeight: 1, paddingTop: '2px' }}>{getTypeIcon(v.type)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <code
                            style={{
                              fontSize: '12px',
                              fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
                              color: 'var(--cyber-neon-cyan, #00f0ff)',
                              fontWeight: 500,
                            }}
                          >
                            {v.variable}
                          </code>
                          <button
                            onClick={() => copyToClipboard(v.variable)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: copiedVar === v.variable ? 'var(--cyber-neon-green, #39ff14)' : 'var(--text-muted, #888)',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'color 0.2s',
                            }}
                            title="Copy variable"
                          >
                            {copiedVar === v.variable ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)', marginBottom: '2px', fontWeight: 400 }}>from: {v.nodeLabel}</div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary, #aaa)',
                            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {v.preview}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #666)', marginTop: '6px', fontStyle: 'italic' }}>
                  Use these variables in node inputs by typing or copying them
                </div>
              </div>
            )
          ) : (
            legacyVariables.length === 0 ? (
              <div className="p-4 text-xs text-muted-foreground">
                No variables yet. Add nodes to the canvas.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {legacyVariables.map((v) => {
                  const token = v.name ? `{{${v.name}}}` : `{{${v.nodeId}}}`;
                  return (
                    <li key={v.nodeId} className="px-3 py-2 hover:bg-muted/20">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">
                            {v.name || v.label}
                          </div>
                          <div className="text-[11px] font-mono text-primary truncate mt-0.5">
                            {token}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {formatValue(v.value)}
                          </div>
                        </div>
                        <button
                          className="shrink-0 p-1 rounded hover:bg-accent"
                          onClick={() => copyToClipboard(token)}
                          title="Copy variable"
                        >
                          {copiedVar === token ? (
                            <CheckCircle2 size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} className="text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          )}
        </div>
      </div>
    </div>
  );
};

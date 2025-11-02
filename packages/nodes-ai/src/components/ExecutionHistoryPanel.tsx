import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

export interface ExecutionRecord {
  id: string;
  timestamp: number;
  duration: number;
  success: boolean;
  nodesExecuted: number;
  error?: string;
}

interface ExecutionHistoryPanelProps {
  history: ExecutionRecord[];
}

export const ExecutionHistoryPanel: React.FC<ExecutionHistoryPanelProps> = ({ history }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) return null;

  const latestExecution = history[0];

  return (
    <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
      {/* Summary Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">
            Execution History ({history.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {latestExecution.success ? (
            <CheckCircle size={12} className="text-green-500" />
          ) : (
            <XCircle size={12} className="text-red-500" />
          )}
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {/* Expanded History List */}
      {isExpanded && (
        <div className="border-t border-border max-h-64 overflow-y-auto">
          {history.map((record) => (
            <div
              key={record.id}
              className="px-3 py-2 border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {record.success ? (
                    <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle size={12} className="text-red-500 flex-shrink-0" />
                  )}
                  <span className="text-xs font-mono text-foreground">
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {record.duration}ms
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {record.nodesExecuted} nodes executed
              </div>
              {record.error && (
                <div className="mt-1 text-[10px] text-red-500 font-mono truncate">
                  Error: {record.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

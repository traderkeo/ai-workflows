import React, { useMemo } from 'react';
import { NodeProps } from '@xyflow/react';
import { StopCircle } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';

export interface StopNodeData {
  label: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  value?: any;
}

export const StopNode: React.FC<NodeProps> = (props) => {
  const data = props.data as unknown as StopNodeData;
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);

  // Calculate total token usage from all connected AI nodes
  const totalTokens = useMemo(() => {
    // Find all nodes that eventually connect to this stop node
    const getUpstreamNodeIds = (nodeId: string, visited = new Set<string>()): Set<string> => {
      if (visited.has(nodeId)) return visited;
      visited.add(nodeId);

      const incomingEdges = edges.filter(e => e.target === nodeId);
      incomingEdges.forEach(edge => {
        getUpstreamNodeIds(edge.source, visited);
      });

      return visited;
    };

    const upstreamNodeIds = getUpstreamNodeIds(props.id);
    const upstreamNodes = nodes.filter(n => upstreamNodeIds.has(n.id));

    // Sum up tokens from all AI nodes
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalAllTokens = 0;

    upstreamNodes.forEach(node => {
      // Check if node has usage data (AI nodes like text-generation, structured-data, ai-agent)
      if (node.data.usage) {
        totalPromptTokens += node.data.usage.promptTokens || 0;
        totalCompletionTokens += node.data.usage.completionTokens || 0;
        totalAllTokens += node.data.usage.totalTokens || 0;
      }
    });

    return {
      prompt: totalPromptTokens,
      completion: totalCompletionTokens,
      total: totalAllTokens,
      hasTokens: totalAllTokens > 0,
    };
  }, [nodes, edges, props.id]);

  return (
    <BaseAINode
      {...props}
      data={data}
      icon={<StopCircle size={20} />}
      hasInput={true}
      hasOutput={false}
    >
      <div className="ai-node-field">
        <div style={{
          padding: '12px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#888',
          fontSize: '11px'
        }}>
          Workflow endpoint - receives final output
        </div>
      </div>

      {/* Total Token Usage */}
      {totalTokens.hasTokens && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Total Token Usage</label>
          <div style={{
            padding: '10px',
            background: 'rgba(176, 38, 255, 0.1)',
            borderRadius: '4px',
            border: '1px solid rgba(176, 38, 255, 0.3)',
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'var(--cyber-neon-purple)',
              marginBottom: '4px',
              fontFamily: 'var(--font-mono)',
            }}>
              {totalTokens.total.toLocaleString()} tokens
            </div>
            <div style={{
              fontSize: '10px',
              color: '#888',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
            }}>
              <span>{totalTokens.prompt.toLocaleString()} prompt</span>
              <span>+</span>
              <span>{totalTokens.completion.toLocaleString()} completion</span>
            </div>
          </div>
        </div>
      )}

      {data.value !== undefined && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Final Output</label>
          <div className="ai-node-field-value" style={{
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: '1px solid rgba(57, 255, 20, 0.3)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '11px'
          }}>
            {typeof data.value === 'object'
              ? JSON.stringify(data.value, null, 2)
              : String(data.value)}
          </div>
        </div>
      )}
    </BaseAINode>
  );
};

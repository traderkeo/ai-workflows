import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Layers, Play } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables } from '../utils/variableResolver';
import type { AggregatorNodeData } from '../types';
import { Button } from '../components/ui/Button';

function tryParseJSON(input: string): any {
  try { return JSON.parse(input); } catch { return undefined; }
}

export const AggregatorNode: React.FC<NodeProps> = (props) => {
  const data = props.data as AggregatorNodeData;
  const updateNode = useFlowStore((s) => s.updateNode);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const [isRunning, setIsRunning] = useState(false);

  const handleChange = (field: keyof AggregatorNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const run = () => {
    const start = performance.now();
    setIsRunning(true);
    updateNode(props.id, { status: 'running' });
    try {
      const itemsTemplate = data.items ?? '{{input}}';
      const resolved = resolveVariables(itemsTemplate, props.id, nodes as any, edges as any);
      const mode = data.mode || 'concat-text';
      let result: any = null;

      if (mode === 'concat-text') {
        // If JSON array provided, join; else treat resolved as string
        const parsed = tryParseJSON(resolved);
        const arr = Array.isArray(parsed) ? parsed : [resolved];
        result = arr.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(data.delimiter ?? '\n');
      } else if (mode === 'flatten-array') {
        const parsed = tryParseJSON(resolved);
        if (!Array.isArray(parsed)) throw new Error('Expected an array for flatten');
        result = (parsed as any[]).flat();
      } else if (mode === 'merge-objects') {
        const parsed = tryParseJSON(resolved);
        if (!Array.isArray(parsed)) throw new Error('Expected an array of objects to merge');
        result = parsed.reduce((acc: any, cur: any) => ({ ...acc, ...cur }), {});
      }

      updateNode(props.id, { status: 'success', result, executionTime: Math.round(performance.now() - start) });
    } catch (e: any) {
      updateNode(props.id, { status: 'error', error: e?.message || String(e) });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <BaseAINode {...props} data={data} icon={<Layers size={18} />}> 
      <div className="ai-node-field">
        <label className="ai-node-field-label">Items (JSON array or text)</label>
        <textarea
          className="ai-node-input ai-node-textarea"
          rows={3}
          value={data.items ?? '{{input}}'}
          onChange={(e) => handleChange('items', e.target.value)}
          placeholder='e.g., {{someNode}} or ["a","b"]'
        />
      </div>
      <div className="ai-node-field grid grid-cols-2 gap-2">
        <div>
          <label className="ai-node-field-label">Mode</label>
          <select
            className="ai-node-select"
            value={data.mode || 'concat-text'}
            onChange={(e) => handleChange('mode', e.target.value as AggregatorNodeData['mode'])}
          >
            <option value="concat-text">Concat Text</option>
            <option value="flatten-array">Flatten Array</option>
            <option value="merge-objects">Merge Objects</option>
          </select>
        </div>
        {data.mode === 'concat-text' && (
          <div>
            <label className="ai-node-field-label">Delimiter</label>
            <input
              type="text"
              className="ai-node-input"
              value={data.delimiter ?? '\n'}
              onChange={(e) => handleChange('delimiter', e.target.value)}
            />
          </div>
        )}
      </div>

      {data.result !== undefined && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Result</label>
          <div className="ai-node-field-value" style={{ maxHeight: 140, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
            {typeof data.result === 'object' ? JSON.stringify(data.result, null, 2) : String(data.result)}
          </div>
        </div>
      )}

      <div className="ai-node-field">
        <Button onClick={run} disabled={isRunning} variant="success" size="sm" className="w-full rounded-full">
          <Play size={14} /> {isRunning ? 'Running…' : 'Run'}
        </Button>
      </div>
    </BaseAINode>
  );
};


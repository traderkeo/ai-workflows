import React, { useMemo, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Scissors, Play } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables } from '../utils/variableResolver';
import type { SplitterNodeData } from '../types';
import { Button } from '../components/ui/Button';

export const SplitterNode: React.FC<NodeProps> = (props) => {
  const data = props.data as SplitterNodeData;
  const updateNode = useFlowStore((s) => s.updateNode);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const [isRunning, setIsRunning] = useState(false);

  const handleChange = (field: keyof SplitterNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const run = () => {
    const start = performance.now();
    setIsRunning(true);
    updateNode(props.id, { status: 'running' });
    try {
      const template = data.input ?? '{{input}}';
      const text = resolveVariables(template, props.id, nodes as any, edges as any);
      const strategy = data.strategy || 'length';
      let chunks: string[] = [];

      if (strategy === 'length') {
        const size = Math.max(1, data.chunkSize ?? 500);
        const overlap = Math.max(0, Math.min(size - 1, data.overlap ?? 0));
        let i = 0;
        while (i < text.length) {
          const end = Math.min(text.length, i + size);
          chunks.push(text.slice(i, end));
          i += size - overlap;
        }
      } else if (strategy === 'lines') {
        chunks = text.split(/\r?\n/).filter((c) => c.length > 0);
      } else if (strategy === 'sentences') {
        chunks = text.split(/(?<=[.!?])\s+/).filter((c) => c.length > 0);
      } else if (strategy === 'regex') {
        if (!data.regexPattern) throw new Error('Regex pattern is required');
        const re = new RegExp(data.regexPattern, data.regexFlags);
        chunks = text.split(re).filter((c) => c.length > 0);
      }

      const elapsed = Math.max(0, Math.round(performance.now() - start));
      updateNode(props.id, {
        status: 'success',
        result: chunks,
        executionTime: elapsed,
      });
    } catch (e: any) {
      updateNode(props.id, { status: 'error', error: e?.message || String(e) });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <BaseAINode {...props} data={data} icon={<Scissors size={18} />}> 
      <div className="ai-node-field">
        <label className="ai-node-field-label">Input</label>
        <textarea
          className="ai-node-input ai-node-textarea"
          rows={3}
          value={data.input ?? '{{input}}'}
          onChange={(e) => handleChange('input', e.target.value)}
          placeholder="Text or variables (e.g., {{input}})"
        />
      </div>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Strategy</label>
        <select
          className="ai-node-select"
          value={data.strategy || 'length'}
          onChange={(e) => handleChange('strategy', e.target.value as SplitterNodeData['strategy'])}
        >
          <option value="length">Fixed Length</option>
          <option value="lines">Lines</option>
          <option value="sentences">Sentences</option>
          <option value="regex">Regex Split</option>
        </select>
      </div>
      {data.strategy === 'length' && (
        <div className="ai-node-field grid grid-cols-2 gap-2">
          <div>
            <label className="ai-node-field-label">Chunk Size</label>
            <input
              type="number"
              className="ai-node-input"
              value={data.chunkSize ?? 500}
              onChange={(e) => handleChange('chunkSize', parseInt(e.target.value || '0', 10))}
              min={1}
            />
          </div>
          <div>
            <label className="ai-node-field-label">Overlap</label>
            <input
              type="number"
              className="ai-node-input"
              value={data.overlap ?? 0}
              onChange={(e) => handleChange('overlap', parseInt(e.target.value || '0', 10))}
              min={0}
            />
          </div>
        </div>
      )}
      {data.strategy === 'regex' && (
        <div className="ai-node-field grid grid-cols-2 gap-2">
          <div>
            <label className="ai-node-field-label">Pattern</label>
            <input
              type="text"
              className="ai-node-input"
              value={data.regexPattern ?? ''}
              onChange={(e) => handleChange('regexPattern', e.target.value)}
            />
          </div>
          <div>
            <label className="ai-node-field-label">Flags</label>
            <input
              type="text"
              className="ai-node-input"
              value={data.regexFlags ?? ''}
              onChange={(e) => handleChange('regexFlags', e.target.value)}
            />
          </div>
        </div>
      )}

      {Array.isArray(data.result) && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Chunks ({data.result.length})</label>
          <div className="ai-node-field-value" style={{ maxHeight: 140, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
            {data.result.slice(0, 10).map((c, i) => (
              <div key={i} className="text-xs text-zinc-300 mb-1">• {c.length > 120 ? c.slice(0, 120) + '…' : c}</div>
            ))}
            {data.result.length > 10 && (
              <div className="text-[11px] text-zinc-500">+ {data.result.length - 10} more…</div>
            )}
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


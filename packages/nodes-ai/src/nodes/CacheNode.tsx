import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { HardDrive, Play } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables } from '../utils/variableResolver';
import type { CacheNodeData } from '../types';
import { Button } from '../components/ui/Button';

const LS_KEY = 'aiwf-cache';

function loadCache(): Record<string, any> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(obj: Record<string, any>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
}

export const CacheNode: React.FC<NodeProps> = (props) => {
  const data = props.data as CacheNodeData;
  const updateNode = useFlowStore((s) => s.updateNode);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const [isRunning, setIsRunning] = useState(false);

  const handleChange = (field: keyof CacheNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const run = () => {
    const start = performance.now();
    setIsRunning(true);
    updateNode(props.id, { status: 'running' });
    try {
      const keyTpl = data.keyTemplate || '{{input}}';
      const key = resolveVariables(keyTpl, props.id, nodes as any, edges as any);
      const op = data.operation || 'get';
      const cache = loadCache();
      let resultValue: any = undefined;
      let hit = false;

      if (op === 'get') {
        if (Object.prototype.hasOwnProperty.call(cache, key)) {
          resultValue = cache[key];
          hit = true;
        } else if (data.writeIfMiss && data.valueTemplate) {
          const valueResolved = resolveVariables(data.valueTemplate, props.id, nodes as any, edges as any);
          cache[key] = valueResolved;
          saveCache(cache);
          resultValue = valueResolved;
          hit = false;
        }
      } else if (op === 'set') {
        const valueResolved = resolveVariables(data.valueTemplate || '', props.id, nodes as any, edges as any);
        cache[key] = valueResolved;
        saveCache(cache);
        resultValue = valueResolved;
        hit = true;
      }

      updateNode(props.id, {
        status: 'success',
        hit,
        value: resultValue,
        result: resultValue,
        executionTime: Math.round(performance.now() - start),
      });
    } catch (e: any) {
      updateNode(props.id, { status: 'error', error: e?.message || String(e) });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <BaseAINode {...props} data={data} icon={<HardDrive size={18} />}> 
      <div className="ai-node-field">
        <label className="ai-node-field-label">Key</label>
        <input
          type="text"
          className="ai-node-input"
          value={data.keyTemplate ?? '{{input}}'}
          onChange={(e) => handleChange('keyTemplate', e.target.value)}
          placeholder="e.g., {{nodeName}}:prompt"
        />
      </div>
      <div className="ai-node-field grid grid-cols-2 gap-2">
        <div>
          <label className="ai-node-field-label">Operation</label>
          <select
            className="ai-node-select"
            value={data.operation || 'get'}
            onChange={(e) => handleChange('operation', e.target.value as CacheNodeData['operation'])}
          >
            <option value="get">Get</option>
            <option value="set">Set</option>
          </select>
        </div>
        {data.operation === 'get' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
            <input
              type="checkbox"
              checked={Boolean(data.writeIfMiss)}
              onChange={(e) => handleChange('writeIfMiss', e.target.checked)}
            />
            Write if miss
          </label>
        )}
      </div>

      {(data.operation === 'set' || data.writeIfMiss) && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Value</label>
          <textarea
            className="ai-node-input ai-node-textarea"
            rows={3}
            value={data.valueTemplate ?? ''}
            onChange={(e) => handleChange('valueTemplate', e.target.value)}
            placeholder="Value to store (supports variables)"
          />
        </div>
      )}

      {data.value !== undefined && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Cache Result {data.hit ? '(hit)' : '(miss)'} </label>
          <div className="ai-node-field-value" style={{ maxHeight: 140, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
            {typeof data.value === 'object' ? JSON.stringify(data.value, null, 2) : String(data.value)}
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


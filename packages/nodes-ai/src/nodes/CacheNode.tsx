import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { HardDrive, Play } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables } from '../utils/variableResolver';
import type { CacheNodeData } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { StatusBadge } from '../components/ui/StatusBadge';

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

const CacheNodeComponent: React.FC<NodeProps> = (props) => {
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
        <Input
          value={data.keyTemplate ?? '{{input}}'}
          onChange={(e) => handleChange('keyTemplate', (e.target as HTMLInputElement).value)}
          placeholder="e.g., {{nodeName}}:prompt"
        />
      </div>
      <div className="ai-node-field grid grid-cols-2 gap-2">
        <div>
          <label className="ai-node-field-label">Operation</label>
          <Select value={data.operation || 'get'} onValueChange={(v) => handleChange('operation', v as CacheNodeData['operation'])}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select operation" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="get">Get</SelectItem>
              <SelectItem value="set">Set</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {data.operation === 'get' && (
          <div className="flex items-center gap-2 mt-5">
            <Switch checked={Boolean(data.writeIfMiss)} onCheckedChange={(v) => handleChange('writeIfMiss', v)} />
            <span className="text-xs">Write if miss</span>
          </div>
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

      {typeof (props.data as any).executionTime === 'number' && (
        <div className="ai-node-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={((props.data as any).status || 'idle') as any} />
            <span style={{ fontSize: 10, color: '#888' }}>Execution Time: {(props.data as any).executionTime}ms</span>
          </div>
          {typeof (props.data as any).hit === 'boolean' && (
            <span className="text-[11px]" style={{ color: (props.data as any).hit ? '#39ff14' : '#ff0040' }}>
              {(props.data as any).hit ? 'HIT' : 'MISS'}
            </span>
          )}
        </div>
      )}
    </BaseAINode>
  );
};

export const CacheNode = React.memo(CacheNodeComponent);
CacheNode.displayName = 'CacheNode';

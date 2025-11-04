import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Search, Play } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables } from '../utils/variableResolver';
import { Button } from '../components/ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from '../components/ui/Select';

interface WebSearchNodeData {
  label: string;
  query?: string;
  model?: string;
  allowedDomains?: string; // comma-separated
  includeSources?: boolean;
  externalWebAccess?: boolean;
  mode?: 'nonreasoning' | 'reasoning' | 'deep-research';
  reasoningEffort?: 'low' | 'medium' | 'high';
  userCountry?: string;
  userCity?: string;
  userRegion?: string;
  userTimezone?: string;
  result?: { text: string; citations?: Array<{ url: string; title?: string; snippet?: string }>; sources?: any[] };
  status?: 'idle' | 'running' | 'success' | 'error';
  error?: string;
}

export const WebSearchNode: React.FC<NodeProps> = (props) => {
  const data = props.data as unknown as WebSearchNodeData;
  const updateNode = useFlowStore((s) => s.updateNode);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const [isRunning, setIsRunning] = useState(false);

  const handleChange = (field: keyof WebSearchNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const run = async () => {
    const start = performance.now();
    setIsRunning(true);
    updateNode(props.id, { status: 'running', error: undefined });
    try {
      const query = resolveVariables(data.query ?? '{{input}}', props.id, nodes as any, edges as any);
      const domains = (data.allowedDomains || '').split(',').map((d) => d.trim()).filter(Boolean);
      const userLocation = (data.userCountry || data.userCity || data.userRegion || data.userTimezone)
        ? {
            type: 'approximate',
            country: data.userCountry || undefined,
            city: data.userCity || undefined,
            region: data.userRegion || undefined,
            timezone: data.userTimezone || undefined,
          }
        : undefined;
      const reasoning = data.mode === 'reasoning' || data.mode === 'deep-research'
        ? { effort: data.reasoningEffort || 'low' }
        : undefined;

      const resp = await fetch('/api/workflows/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          model: data.model || (data.mode === 'deep-research' ? 'o4-mini-deep-research' : 'gpt-4o-mini'),
          filters: domains.length ? { allowedDomains: domains } : undefined,
          externalWebAccess: data.externalWebAccess !== false,
          includeSources: !!data.includeSources,
          userLocation,
          reasoning,
          toolChoice: 'auto',
        }),
      });
      if (!resp.ok) {
        const json = await resp.json();
        throw new Error(json.error || 'Web search failed');
      }
      const json = await resp.json();
      updateNode(props.id, { status: 'success', result: { text: json.text, citations: json.citations, sources: json.sources }, executionTime: Math.round(performance.now() - start) });
    } catch (e: any) {
      updateNode(props.id, { status: 'error', error: e?.message || String(e) });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <BaseAINode {...props} data={data} icon={<Search size={18} />}> 
      <div className="ai-node-field">
        <label className="ai-node-field-label">Query</label>
        <input
          type="text"
          className="ai-node-input"
          value={data.query ?? '{{input}}'}
          onChange={(e) => handleChange('query', e.target.value)}
          placeholder="e.g., latest on Llama 4"
        />
      </div>
      <div className="ai-node-field grid grid-cols-3 gap-2">
        <div>
          <label className="ai-node-field-label">Model</label>
          <Select value={data.model ?? 'gpt-4o-mini'} onValueChange={(value) => handleChange('model', value)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select a model" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Recommended</SelectLabel>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Reasoning</SelectLabel>
                <SelectItem value="gpt-5">GPT-5</SelectItem>
                <SelectItem value="o4-mini">O4-mini</SelectItem>
                <SelectItem value="o4-mini-deep-research">O4-mini Deep Research</SelectItem>
                <SelectItem value="o3-deep-research">O3 Deep Research</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Search Specialized</SelectLabel>
                <SelectItem value="gpt-5-search-api">GPT-5 Search API</SelectItem>
                <SelectItem value="gpt-4o-search-preview">GPT-4o Search Preview</SelectItem>
                <SelectItem value="gpt-4o-mini-search-preview">GPT-4o Mini Search Preview</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Other</SelectLabel>
                <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="ai-node-field-label">Mode</label>
          <select className="ai-node-select" value={data.mode ?? 'nonreasoning'} onChange={(e) => handleChange('mode', e.target.value as WebSearchNodeData['mode'])}>
            <option value="nonreasoning">Non-reasoning</option>
            <option value="reasoning">Reasoning</option>
            <option value="deep-research">Deep research</option>
          </select>
        </div>
        <label className="flex items-center gap-2" style={{ marginTop: 22 }}>
          <input type="checkbox" checked={data.includeSources ?? false} onChange={(e) => handleChange('includeSources', e.target.checked)} /> Include sources
        </label>
      </div>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Allowed Domains (comma-separated)</label>
        <input type="text" className="ai-node-input" value={data.allowedDomains ?? ''} onChange={(e) => handleChange('allowedDomains', e.target.value)} placeholder="example.com, another.com" />
        <label className="flex items-center gap-2 text-xs mt-2">
          <input type="checkbox" checked={data.externalWebAccess !== false} onChange={(e) => handleChange('externalWebAccess', e.target.checked)} /> Allow live internet access
        </label>
      </div>

      {(data.mode === 'reasoning' || data.mode === 'deep-research') && (
        <div className="ai-node-field grid grid-cols-4 gap-2">
          <div>
            <label className="ai-node-field-label">Reasoning Effort</label>
            <select className="ai-node-select" value={data.reasoningEffort ?? 'low'} onChange={(e) => handleChange('reasoningEffort', e.target.value as WebSearchNodeData['reasoningEffort'])}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="ai-node-field-label">Country (ISO)</label>
            <input type="text" className="ai-node-input" value={data.userCountry ?? ''} onChange={(e) => handleChange('userCountry', e.target.value)} placeholder="US" />
          </div>
          <div>
            <label className="ai-node-field-label">City</label>
            <input type="text" className="ai-node-input" value={data.userCity ?? ''} onChange={(e) => handleChange('userCity', e.target.value)} placeholder="London" />
          </div>
          <div>
            <label className="ai-node-field-label">Region</label>
            <input type="text" className="ai-node-input" value={data.userRegion ?? ''} onChange={(e) => handleChange('userRegion', e.target.value)} placeholder="London" />
          </div>
          <div className="col-span-2">
            <label className="ai-node-field-label">Timezone</label>
            <input type="text" className="ai-node-input" value={data.userTimezone ?? ''} onChange={(e) => handleChange('userTimezone', e.target.value)} placeholder="America/Chicago" />
          </div>
        </div>
      )}

      {data.result?.text && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Result</label>
          <div className="ai-node-field-value" style={{ maxHeight: 160, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
            {data.result.text}
          </div>
        </div>
      )}

      {data.result?.citations && data.result.citations.length > 0 && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Citations</label>
          <ul className="text-xs list-disc pl-4">
            {data.result.citations.slice(0, 5).map((c, i) => (
              <li key={i}><a href={c.url} target="_blank" rel="noreferrer" className="underline">{c.title || c.url}</a></li>
            ))}
            {data.result.citations.length > 5 && <li className="text-[11px] text-zinc-500">+ {data.result.citations.length - 5} more…</li>}
          </ul>
        </div>
      )}

      <div className="ai-node-field">
        <Button onClick={run} disabled={isRunning} variant="success" size="sm" className="w-full rounded-full">
          <Play size={14} /> {isRunning ? 'Searching…' : 'Search'}
        </Button>
      </div>
    </BaseAINode>
  );
};

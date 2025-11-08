import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Search, Play, Settings, Filter, FileText } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables } from '../utils/variableResolver';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Switch } from '../components/ui/Switch';
import { CollapsibleSection } from '../components/ui/CollapsibleSection';

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

const WebSearchNodeComponent: React.FC<NodeProps> = (props) => {
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
      {/* Query & Model Section */}
      <CollapsibleSection title="Query & Model" icon={<Search size={14} />} defaultOpen={true}>
        <div className="ai-node-field">
          <label className="ai-node-field-label">Query</label>
          <Input value={data.query ?? '{{input}}'} onChange={(e) => handleChange('query', e.target.value)} placeholder="e.g., latest on Llama 4" />
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
            <Select value={data.mode ?? 'nonreasoning'} onValueChange={(v) => handleChange('mode', v as WebSearchNodeData['mode'])}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select mode" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Modes</SelectLabel>
                  <SelectItem value="nonreasoning">Non-reasoning</SelectItem>
                  <SelectItem value="reasoning">Reasoning</SelectItem>
                  <SelectItem value="deep-research">Deep research</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2" style={{ marginTop: 22 }}>
            <Switch checked={data.includeSources ?? false} onCheckedChange={(v) => handleChange('includeSources', v)} />
            <span className="text-xs text-zinc-300">Include sources</span>
          </div>
        </div>
      </CollapsibleSection>

      {/* Filters Section */}
      <CollapsibleSection title="Filters & Access" icon={<Filter size={14} />} defaultOpen={false}>
        <div className="ai-node-field">
          <label className="ai-node-field-label">Allowed Domains (comma-separated)</label>
          <Input value={data.allowedDomains ?? ''} onChange={(e) => handleChange('allowedDomains', e.target.value)} placeholder="example.com, another.com" />
          <div className="flex items-center gap-2 text-xs mt-2">
            <Switch checked={data.externalWebAccess !== false} onCheckedChange={(v) => handleChange('externalWebAccess', v)} />
            <span>Allow live internet access</span>
          </div>
        </div>
      </CollapsibleSection>

      {/* Advanced Settings */}
      {(data.mode === 'reasoning' || data.mode === 'deep-research') && (
        <CollapsibleSection title="Advanced Settings" icon={<Settings size={14} />} defaultOpen={false}>
          <div className="ai-node-field grid grid-cols-4 gap-2">
            <div>
              <label className="ai-node-field-label">Reasoning Effort</label>
              <Select value={data.reasoningEffort ?? 'low'} onValueChange={(v) => handleChange('reasoningEffort', v as WebSearchNodeData['reasoningEffort'])}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Effort" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Effort</SelectLabel>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="ai-node-field-label">Country (ISO)</label>
              <Input value={data.userCountry ?? ''} onChange={(e) => handleChange('userCountry', e.target.value)} placeholder="US" />
            </div>
            <div>
              <label className="ai-node-field-label">City</label>
              <Input value={data.userCity ?? ''} onChange={(e) => handleChange('userCity', e.target.value)} placeholder="London" />
            </div>
            <div>
              <label className="ai-node-field-label">Region</label>
              <Input value={data.userRegion ?? ''} onChange={(e) => handleChange('userRegion', e.target.value)} placeholder="London" />
            </div>
            <div className="col-span-2">
              <label className="ai-node-field-label">Timezone</label>
              <Input value={data.userTimezone ?? ''} onChange={(e) => handleChange('userTimezone', e.target.value)} placeholder="America/Chicago" />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Results Section */}
      {(data.result?.text || data.result?.citations) && (
        <CollapsibleSection title="Results" icon={<FileText size={14} />} defaultOpen={true}>
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
        </CollapsibleSection>
      )}

      <div className="ai-node-field" style={{ marginTop: 8 }}>
        <Button onClick={run} disabled={isRunning} variant="default" size="sm" className="w-full rounded-full">
          <Play size={14} /> {isRunning ? 'Searching…' : 'Search'}
        </Button>
      </div>

      {typeof (props.data as any).executionTime === 'number' && (
        <div className="ai-node-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={((props.data as any).status || 'idle') as any} />
            <span style={{ fontSize: 10, color: '#888' }}>Execution Time: {(props.data as any).executionTime}ms</span>
          </div>
        </div>
      )}
    </BaseAINode>
  );
};

export const WebSearchNode = React.memo(WebSearchNodeComponent);
WebSearchNode.displayName = 'WebSearchNode';

import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { FileText, Play } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables } from '../utils/variableResolver';
import type { DocumentIngestNodeData } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { StatusBadge } from '../components/ui/StatusBadge';

export const DocumentIngestNode: React.FC<NodeProps> = (props) => {
  const data = props.data as DocumentIngestNodeData;
  const updateNode = useFlowStore((s) => s.updateNode);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const [isRunning, setIsRunning] = useState(false);

  const handleChange = (field: keyof DocumentIngestNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const run = async () => {
    const start = performance.now();
    setIsRunning(true);
    updateNode(props.id, { status: 'running', error: undefined });
    try {
      const mode = data.sourceType || 'text';
      let documents: string[] = [];

      if (mode === 'text') {
        const text = resolveVariables(data.textTemplate ?? '{{input}}', props.id, nodes as any, edges as any);
        if (text && text.trim()) documents = [text];
      } else if (mode === 'url') {
        const url = resolveVariables(data.url || '', props.id, nodes as any, edges as any).trim();
        if (!url) throw new Error('URL is required');
        const res = await fetch(url);
        const html = await res.text();
        if (data.extractText) {
          try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            doc.querySelectorAll('script,style,noscript').forEach((n) => n.remove());
            const text = doc.body?.innerText || doc.body?.textContent || '';
            if (text.trim()) documents = [text.trim()];
          } catch {
            documents = [html];
          }
        } else {
          documents = [html];
        }
      }

      let chunks: string[] | undefined;
      let embeddings: number[][] | undefined;
      if (data.split && documents.length > 0) {
        const size = Math.max(1, data.chunkSize ?? 1000);
        const overlap = Math.max(0, Math.min(size - 1, data.overlap ?? 0));
        chunks = [];
        for (const d of documents) {
          let i = 0;
          while (i < d.length) {
            const end = Math.min(d.length, i + size);
            chunks.push(d.slice(i, end));
            i += size - overlap;
          }
        }
      }

      // Optionally compute embeddings (prefer chunks when available)
      if (data.embed) {
        const texts = (chunks && chunks.length > 0 ? chunks : documents);
        if (texts.length > 0) {
          const resp = await fetch('/api/workflows/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              texts,
              model: data.embeddingModel || 'text-embedding-3-small',
              dimensions: data.embeddingDimensions ?? undefined,
            }),
          });
          if (resp.ok) {
            const json = await resp.json();
            if (json.success) {
              embeddings = json.embeddings as number[][];
            }
          }
        }
      }

      updateNode(props.id, { status: 'success', result: { documents, chunks, embeddings }, executionTime: Math.round(performance.now() - start) });
    } catch (e: any) {
      updateNode(props.id, { status: 'error', error: e?.message || String(e) });
    } finally {
      setIsRunning(false);
    }
  };

  const previewDocs = data.result?.documents || [];
  const previewChunks = data.result?.chunks || [];

  return (
    <BaseAINode {...props} data={data} icon={<FileText size={18} />}> 
      <div className="ai-node-field grid grid-cols-2 gap-2">
        <div>
          <label className="ai-node-field-label">Source</label>
          <Select value={data.sourceType || 'text'} onValueChange={(v) => handleChange('sourceType', v as DocumentIngestNodeData['sourceType'])}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="url">URL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {data.sourceType === 'url' && (
          <div className="flex items-center gap-2 text-xs" style={{ marginTop: 22 }}>
            <Switch checked={Boolean(data.extractText)} onCheckedChange={(v) => handleChange('extractText', v)} />
            <span>Extract text</span>
          </div>
        )}
      </div>

      {data.sourceType !== 'url' ? (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Text</label>
          <textarea
            className="ai-node-input ai-node-textarea"
            rows={4}
            value={data.textTemplate ?? '{{input}}'}
            onChange={(e) => handleChange('textTemplate', e.target.value)}
            placeholder="Paste or reference variables (e.g., {{input}})"
          />
        </div>
      ) : (
        <div className="ai-node-field">
          <label className="ai-node-field-label">URL</label>
          <Input
            value={data.url ?? ''}
            onChange={(e) => handleChange('url', (e.target as HTMLInputElement).value)}
            placeholder="https://example.com or {{node}}"
          />
        </div>
      )}

      <div className="ai-node-field">
        <label className="ai-node-field-label">Split</label>
        <div className="grid grid-cols-3 gap-2 items-center">
          <div className="flex items-center gap-2 col-span-1">
            <Switch checked={Boolean(data.split)} onCheckedChange={(v) => handleChange('split', v)} />
            <span className="text-xs">Enable</span>
          </div>
          <div className="col-span-1">
            <label className="ai-node-field-label">Chunk</label>
            <Input type="number" value={data.chunkSize ?? 1000} min={100} onChange={(e) => handleChange('chunkSize', parseInt((e.target as HTMLInputElement).value || '0', 10))} />
          </div>
          <div className="col-span-1">
            <label className="ai-node-field-label">Overlap</label>
            <Input type="number" value={data.overlap ?? 0} min={0} onChange={(e) => handleChange('overlap', parseInt((e.target as HTMLInputElement).value || '0', 10))} />
          </div>
        </div>
      </div>

      {/* Embeddings */}
      <div className="ai-node-field">
        <label className="ai-node-field-label">Embeddings</label>
        <div className="grid grid-cols-3 gap-2 items-center">
          <div className="flex items-center gap-2 col-span-1">
            <Switch checked={Boolean(data.embed)} onCheckedChange={(v) => handleChange('embed', v)} />
            <span className="text-xs">Compute</span>
          </div>
          <div className="col-span-1">
            <label className="ai-node-field-label">Model</label>
            <Input value={data.embeddingModel ?? 'text-embedding-3-small'} onChange={(e) => handleChange('embeddingModel', (e.target as HTMLInputElement).value)} />
          </div>
          <div className="col-span-1">
            <label className="ai-node-field-label">Dims (opt)</label>
            <Input type="number" value={data.embeddingDimensions ?? ''} onChange={(e) => handleChange('embeddingDimensions', (e.target as HTMLInputElement).value === '' ? null : parseInt((e.target as HTMLInputElement).value || '0', 10))} />
          </div>
        </div>
        {data.result?.embeddings && (
          <div className="text-[11px] text-zinc-400 mt-1">Embeddings: {data.result.embeddings.length} vectors</div>
        )}
      </div>

      {(previewDocs.length > 0 || previewChunks.length > 0) && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Preview</label>
          <div className="ai-node-field-value" style={{ maxHeight: 160, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
            {previewChunks.length > 0 ? (
              <>
                <div className="text-xs text-zinc-400 mb-2">Chunks: {previewChunks.length}</div>
                {previewChunks.slice(0, 8).map((c, i) => (
                  <div key={i} className="text-xs mb-1">• {c.length > 160 ? c.slice(0, 160) + '…' : c}</div>
                ))}
                {previewChunks.length > 8 && <div className="text-[11px] text-zinc-500">+ {previewChunks.length - 8} more…</div>}
              </>
            ) : (
              <>
                <div className="text-xs text-zinc-400 mb-2">Documents: {previewDocs.length}</div>
                {previewDocs.slice(0, 3).map((d, i) => (
                  <div key={i} className="text-xs mb-1">• {d.length > 200 ? d.slice(0, 200) + '…' : d}</div>
                ))}
                {previewDocs.length > 3 && <div className="text-[11px] text-zinc-500">+ {previewDocs.length - 3} more…</div>}
              </>
            )}
          </div>
        </div>
      )}

      <div className="ai-node-field">
        <Button onClick={run} disabled={isRunning} variant="success" size="sm" className="w-full rounded-full">
          <Play size={14} /> {isRunning ? 'Ingesting…' : 'Ingest'}
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

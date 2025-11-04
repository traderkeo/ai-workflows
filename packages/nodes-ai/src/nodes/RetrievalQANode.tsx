import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Search, Play } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables } from '../utils/variableResolver';
import type { RetrievalQANodeData } from '../types';
import { Button } from '../components/ui/Button';

function parseCorpus(input: any): string[] {
  if (Array.isArray(input)) {
    return input.map((item) => (typeof item === 'string' ? item : (item?.text ?? JSON.stringify(item))));
  }
  if (typeof input === 'string') {
    try {
      const arr = JSON.parse(input);
      if (Array.isArray(arr)) return arr.map((x) => (typeof x === 'string' ? x : (x?.text ?? JSON.stringify(x))));
      return [input];
    } catch {
      return [input];
    }
  }
  return [String(input ?? '')];
}

function score(query: string, text: string): number {
  const q = query.toLowerCase().split(/\W+/).filter(Boolean);
  const t = text.toLowerCase();
  let s = 0;
  for (const token of q) if (t.includes(token)) s += 1;
  return s;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) { dot += a[i] * b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export const RetrievalQANode: React.FC<NodeProps> = (props) => {
  const data = props.data as RetrievalQANodeData;
  const updateNode = useFlowStore((s) => s.updateNode);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const [isRunning, setIsRunning] = useState(false);

  const handleChange = (field: keyof RetrievalQANodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const run = async () => {
    const start = performance.now();
    setIsRunning(true);
    updateNode(props.id, { status: 'running', error: undefined });
    try {
      const query = resolveVariables(data.queryTemplate || '{{input}}', props.id, nodes as any, edges as any);

      // Pull corpus from first upstream node with result/documents/chunks
      const incoming = edges.filter(e => e.target === props.id).map(e => nodes.find(n => n.id === e.source)).filter(Boolean) as any[];
      const candidate = incoming.find(n => n?.data?.result?.chunks || n?.data?.result?.documents || n?.data?.result);
      const corpusSource = candidate?.data?.result?.chunks || candidate?.data?.result?.documents || candidate?.data?.result;
      const embeddings = candidate?.data?.result?.embeddings as number[][] | undefined;
      const corpus = parseCorpus(corpusSource ?? '');

      let ranked: Array<{ idx: number; text: string; score: number }> = [];
      if (embeddings && embeddings.length === corpus.length) {
        // Get query embedding from API
        const resp = await fetch('/api/workflows/embeddings', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: [query], model: 'text-embedding-3-small' })
        });
        let qvec: number[] | undefined;
        if (resp.ok) {
          const js = await resp.json();
          qvec = js.embeddings?.[0];
        }
        if (qvec) {
          ranked = corpus.map((text, idx) => ({ idx, text, score: cosine(qvec!, embeddings[idx]) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, Math.max(1, data.topK ?? 3));
        }
      }
      if (ranked.length === 0) {
        ranked = corpus
          .map((text, idx) => ({ idx, text, score: score(query, text) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, Math.max(1, data.topK ?? 3));
      }

      const contextStr = ranked.map((r, i) => `[${i + 1}] ${r.text}`).join('\n\n');
      const model = data.model || 'gpt-4o-mini';
      const temperature = data.temperature ?? 0.3;

      const response = await fetch('/api/workflows/test-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeType: 'text-generation',
          config: {
            prompt: `You are a helpful assistant. Use the context to answer the question with citations.\n\nContext:\n${contextStr}\n\nQuestion: ${query}\n\nAnswer with citations in the form [n].`,
            model,
            temperature,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Retrieval QA request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader available');
      let finalText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) throw new Error(data.error);
              if (data.fullText) finalText = data.fullText;
              if (data.done) finalText = data.text || data.fullText || finalText;
            } catch {}
          }
        }
      }

      const citations = ranked.map((r, i) => ({ index: i + 1, snippet: r.text.slice(0, 160) }));
      updateNode(props.id, { status: 'success', answer: finalText, citations, result: { answer: finalText, citations }, executionTime: Math.round(performance.now() - start) });
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
          value={data.queryTemplate ?? '{{input}}'}
          onChange={(e) => handleChange('queryTemplate', e.target.value)}
          placeholder="e.g., {{input}} or explicit question"
        />
      </div>
      <div className="ai-node-field grid grid-cols-2 gap-2">
        <div>
          <label className="ai-node-field-label">Top K</label>
          <input type="number" className="ai-node-input" value={data.topK ?? 3} min={1} onChange={(e) => handleChange('topK', parseInt(e.target.value || '1', 10))} />
        </div>
        <div>
          <label className="ai-node-field-label">Model</label>
          <input type="text" className="ai-node-input" value={data.model ?? 'gpt-4o-mini'} onChange={(e) => handleChange('model', e.target.value)} />
        </div>
      </div>

      {data.answer && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Answer</label>
          <div className="ai-node-field-value" style={{ maxHeight: 160, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
            {data.answer}
          </div>
        </div>
      )}

      {data.citations && data.citations.length > 0 && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Citations</label>
          <ul className="text-xs list-disc pl-4">
            {data.citations.slice(0, 5).map((c, i) => (
              <li key={i}>[{c.index}] {c.snippet}{c.snippet.length > 150 ? '…' : ''}</li>
            ))}
            {data.citations.length > 5 && <li className="text-[11px] text-zinc-500">+ {data.citations.length - 5} more…</li>}
          </ul>
        </div>
      )}

      <div className="ai-node-field">
        <Button onClick={run} disabled={isRunning} variant="success" size="sm" className="w-full rounded-full">
          <Play size={14} /> {isRunning ? 'Answering…' : 'Answer'}
        </Button>
      </div>
    </BaseAINode>
  );
};

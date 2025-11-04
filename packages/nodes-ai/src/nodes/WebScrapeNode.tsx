import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Globe, Play } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables } from '../utils/variableResolver';
import type { WebScrapeNodeData } from '../types';
import { Button } from '../components/ui/Button';

function extractTextFromHTML(html: string): { title?: string; text: string } {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // remove scripts/styles
    doc.querySelectorAll('script,style,noscript').forEach((n) => n.remove());
    const title = doc.querySelector('title')?.textContent || undefined;
    const text = doc.body?.innerText || doc.body?.textContent || '';
    return { title, text: text.trim() };
  } catch {
    return { text: html };
  }
}

export const WebScrapeNode: React.FC<NodeProps> = (props) => {
  const data = props.data as WebScrapeNodeData;
  const updateNode = useFlowStore((s) => s.updateNode);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const [isRunning, setIsRunning] = useState(false);

  const handleChange = (field: keyof WebScrapeNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const run = async () => {
    const start = performance.now();
    setIsRunning(true);
    updateNode(props.id, { status: 'running' });
    try {
      const urlTpl = data.url || '';
      const url = resolveVariables(urlTpl, props.id, nodes as any, edges as any).trim();
      if (!url) throw new Error('URL is required');

      const res = await fetch(url, { method: 'GET' });
      const status = res.status;
      const html = await res.text();
      const { title, text } = data.extractText ? extractTextFromHTML(html) : { title: undefined, text: '' };
      const result = data.extractText ? { status, title, content: text, html: undefined } : { status, html };

      updateNode(props.id, { status: 'success', result, executionTime: Math.round(performance.now() - start) });
    } catch (e: any) {
      updateNode(props.id, {
        status: 'error',
        result: { status: 0, error: e?.message || String(e) },
        error: e?.message || String(e),
      });
    } finally {
      setIsRunning(false);
    }
  };

  const preview = data.result?.content || data.result?.html;

  return (
    <BaseAINode {...props} data={data} icon={<Globe size={18} />}> 
      <div className="ai-node-field">
        <label className="ai-node-field-label">URL</label>
        <input
          type="text"
          className="ai-node-input"
          value={data.url ?? ''}
          onChange={(e) => handleChange('url', e.target.value)}
          placeholder="https://example.com or {{node}}"
        />
        <label className="flex items-center gap-2 text-xs mt-2">
          <input
            type="checkbox"
            checked={Boolean(data.extractText)}
            onChange={(e) => handleChange('extractText', e.target.checked)}
          />
          Extract readable text
        </label>
      </div>

      {preview && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Preview</label>
          <div className="ai-node-field-value" style={{ maxHeight: 140, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
            {String(preview).slice(0, 1000)}{String(preview).length > 1000 ? '…' : ''}
          </div>
        </div>
      )}

      <div className="ai-node-field">
        <Button onClick={run} disabled={isRunning} variant="success" size="sm" className="w-full rounded-full">
          <Play size={14} /> {isRunning ? 'Fetching…' : 'Fetch'}
        </Button>
      </div>
    </BaseAINode>
  );
};


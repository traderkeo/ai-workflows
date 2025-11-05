import React, { useMemo } from 'react';
import { NodeProps } from '@xyflow/react';
import { ListFilter } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { resolveVariables, getAvailableVariables } from '../utils/variableResolver';
import type { RerankNodeData } from '../types';
import { Button } from '../components/ui/Button';

export const RerankNode: React.FC<NodeProps> = (props) => {
  const data = props.data as RerankNodeData;
  const updateNode = useFlowStore((s) => s.updateNode);
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  const availableVariables = useMemo(() => getAvailableVariables(props.id, nodes, edges), [props.id, nodes, edges]);

  const handleChange = (field: keyof RerankNodeData, value: any) => updateNode(props.id, { [field]: value });
  const handleDelete = () => { if (confirm('Delete this node?')) deleteNode(props.id); };

  const preview = () => {
    const query = resolveVariables(data.query || '', props.id, nodes, edges);
    const candidates = (resolveVariables(data.candidates || '', props.id, nodes, edges) || '').split('\n').filter(Boolean);
    const topK = data.topK ?? 5;
    return { query, candidates, topK };
  };

  const p = preview();

  return (
    <BaseAINode {...props} data={data} icon={<ListFilter size={20} />}>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Query</label>
        <input className="ai-node-input" value={data.query || ''} onChange={(e) => handleChange('query', e.target.value)} placeholder="{{previous-node}} or text" />
      </div>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Candidates (one per line)</label>
        <textarea className="ai-node-input ai-node-textarea" rows={5} value={data.candidates || ''} onChange={(e) => handleChange('candidates', e.target.value)} placeholder="Item A\nItem B\nItem C" />
      </div>
      <div className="ai-node-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label className="ai-node-field-label">Top K</label>
          <input type="number" className="ai-node-input" value={data.topK ?? 5} onChange={(e) => handleChange('topK', parseInt(e.target.value))} min={1} />
        </div>
        <div>
          <label className="ai-node-field-label">Model (Together/OpenAI)</label>
          <input className="ai-node-input" value={data.model || ''} onChange={(e) => handleChange('model', e.target.value)} placeholder="Optional model id (scaffold)" />
        </div>
      </div>
      <div className="ai-node-field">
        <div className="ai-node-field-value" style={{ fontSize: 12, color: '#bbb' }}>
          Coming soon: invoke rerank API via workers-ai. Preview below shows resolved inputs only.
        </div>
      </div>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Preview</label>
        <div className="ai-node-field-value" style={{ maxHeight: 150, overflowY: 'auto', padding: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 4, border: '1px solid rgba(176,38,255,0.3)', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 12 }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(p, null, 2)}</pre>
        </div>
      </div>
      <div className="ai-node-field" style={{ display: 'flex', gap: 8 }}>
        <Button disabled className="flex-1" variant="outline">Run (disabled)</Button>
        <Button onClick={handleDelete} variant="outline">Delete</Button>
      </div>
    </BaseAINode>
  );
};

import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Volume2, Play, Trash2 } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import type { AudioTTSNodeData } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ModelSelector } from '../components/ModelSelector';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from '../components/ui/Select';
import type { GenerationMode } from '../config/modelCapabilities';

export const AudioTTSNode: React.FC<NodeProps> = (props) => {
  const data = props.data as AudioTTSNodeData;
  const updateNode = useFlowStore((s) => s.updateNode);
  const deleteNode = useFlowStore((s) => s.deleteNode);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleChange = (field: keyof AudioTTSNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const handleDelete = () => {
    if (confirm('Delete this node?')) deleteNode(props.id);
  };

  const handleTest = async () => {
    if (!data.text?.trim()) {
      alert('Enter text to synthesize');
      return;
    }
    setIsTesting(true);
    setTestResult({ type: 'audio', loading: true });
    const start = performance.now();
    updateNode(props.id, { status: 'running' });
    try {
      const res = await fetch('/api/workflows/test-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeType: 'speech-generation',
          config: {
            text: data.text,
            model: data.model || 'tts-1',
            voice: data.voice || 'alloy',
            speed: data.speed ?? 1.0,
            instructions: data.instructions,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Speech generation failed');
      const audioResult = { type: 'audio', audio: result.audio, format: result.format, loading: false };
      setTestResult(audioResult);
      const exec = result?.metadata?.executionTime ?? Math.round(performance.now() - start);
      updateNode(props.id, { result: audioResult, status: 'success', executionTime: exec });
    } catch (e: any) {
      setTestResult({ error: e.message });
      updateNode(props.id, { status: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <BaseAINode {...props} data={data} icon={<Volume2 size={20} />}>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Text</label>
        <textarea className="ai-node-input ai-node-textarea nodrag" rows={3} value={data.text || ''} onChange={(e) => handleChange('text', e.target.value)} placeholder="Enter text to synthesize..." />
      </div>
      <div className="ai-node-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label className="ai-node-field-label">Model</label>
          <ModelSelector value={data.model || 'tts-1'} mode={'speech' as GenerationMode} onChange={(id) => handleChange('model', id)} />
        </div>
        <div>
          <label className="ai-node-field-label">Voice</label>
          <Select value={(data.voice as any) || 'alloy'} onValueChange={(v) => handleChange('voice', v as any)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select a voice" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Voices</SelectLabel>
                <SelectItem value="alloy">alloy</SelectItem>
                <SelectItem value="echo">echo</SelectItem>
                <SelectItem value="fable">fable</SelectItem>
                <SelectItem value="onyx">onyx</SelectItem>
                <SelectItem value="nova">nova</SelectItem>
                <SelectItem value="shimmer">shimmer</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="ai-node-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label className="ai-node-field-label">Speed</label>
          <Input type="number" min={0.25} max={4} step={0.05} value={data.speed ?? 1.0} onChange={(e) => handleChange('speed', parseFloat((e.target as HTMLInputElement).value))} />
        </div>
        <div>
          <label className="ai-node-field-label">Instructions (optional)</label>
          <Input value={data.instructions || ''} onChange={(e) => handleChange('instructions', (e.target as HTMLInputElement).value)} placeholder="Style guidance" />
        </div>
      </div>

      {(testResult || data.result) && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Result</label>
          <div className="max-h-[200px] overflow-y-auto px-3 py-2 bg-black/30 rounded-md border border-green-500/30 text-[13px] text-zinc-200">
            {(() => {
              const r = (testResult || data.result) as any;
              if (r?.type === 'audio') {
                if (r.loading) return <div style={{ color: '#aaa' }}>Generating audio…</div>;
                if (r.audio) return (<audio controls className="w-full" src={`data:audio/${r.format || 'mp3'};base64,${r.audio}`} />);
              }
              if (r?.error) return <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>Error: {r.error}</pre>;
              return null;
            })()}
          </div>
        </div>
      )}

      <div className="ai-node-field" style={{ display: 'flex', gap: 8 }}>
        <Button onClick={handleTest} disabled={isTesting} variant="success" className="flex-1">
          <Play size={14} /> {isTesting ? 'Testing…' : 'Test'}
        </Button>
        <Button onClick={handleDelete} variant="outline">
          <Trash2 size={14} />
        </Button>
      </div>

      {(props.data as any).executionTime !== undefined && (
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

import React, { useMemo, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Image as ImageIcon, Play, Trash2, MessageSquare, Settings, Sliders, Image as ImageImg, FileText } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { getAvailableVariablesWithInfo } from '../utils/variableResolver';
import { ImageSourceSelector } from '../components/ImageSourceSelector';
import type { ImageGenerationNodeData } from '../types';
import { ModelSelector } from '../components/ModelSelector';
import type { GenerationMode } from '../config/modelCapabilities';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CollapsibleSection } from '../components/ui/CollapsibleSection';

const ImageGenerationNodeComponent: React.FC<NodeProps> = (props) => {
  const data = props.data as ImageGenerationNodeData;
  const updateNode = useFlowStore((s) => s.updateNode);
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const availableVars = useMemo(() => getAvailableVariablesWithInfo(props.id, nodes, edges), [props.id, nodes, edges]);
  const availableImages = useMemo(() => availableVars.filter(v => v.type === 'image'), [availableVars]);

  const handleChange = (field: keyof ImageGenerationNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const handleDelete = () => {
    if (confirm('Delete this node?')) deleteNode(props.id);
  };

  const operation = data.operation || 'generate';

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult({ type: 'image', loading: true });
    const start = performance.now();
    updateNode(props.id, { status: 'running' });
    try {
      let nodeType = 'image-generation';
      let payload: any = {
        prompt: data.prompt || '',
        model: data.model || 'dall-e-3',
        size: data.size || '1024x1024',
      };

      if ((data.model || '').includes('/')) {
        payload = {
          ...payload,
          steps: data.steps,
          seed: data.seed,
          negative_prompt: data.negativePrompt,
          aspect_ratio: data.aspectRatio,
          image_url: data.referenceUrl,
          disable_safety_checker: data.disableSafetyChecker,
          response_format: data.responseFormat || 'url',
          n: data.n ?? 1,
        };
        if (data.imageLorasJson) {
          try { payload.image_loras = JSON.parse(data.imageLorasJson); } catch {}
        }
      } else {
        if (data.quality) (payload as any).quality = data.quality;
        if (data.style) (payload as any).style = data.style;
        (payload as any).response_format = (data.responseFormat as any) || 'b64_json';
        (payload as any).n = data.n ?? 1;
      }

      if (operation === 'edit') {
        nodeType = 'image-edit';
        payload = {
          prompt: data.prompt || '',
          image: data.sourceImage,
          mask: data.maskImage,
          model: data.model || 'dall-e-2',
          size: data.size || '1024x1024',
          n: data.n ?? 1,
          response_format: data.responseFormat || 'b64_json',
        };
      } else if (operation === 'variation') {
        nodeType = 'image-variation';
        payload = {
          image: data.sourceImage,
          model: data.model || 'dall-e-2',
          size: data.size || '1024x1024',
          n: data.n ?? 1,
          response_format: data.responseFormat || 'b64_json',
        };
      }

      const res = await fetch('/api/workflows/test-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeType, config: payload }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Image operation failed');
      const imageResult = { type: 'image', image: result.image, format: result.format, revisedPrompt: result.revisedPrompt, loading: false };
      setTestResult(imageResult);
      const exec = result?.metadata?.executionTime ?? Math.round(performance.now() - start);
      updateNode(props.id, { result: imageResult, status: 'success', executionTime: exec });
    } catch (e: any) {
      setTestResult({ error: e.message });
      updateNode(props.id, { status: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <BaseAINode {...props} data={data} icon={<ImageIcon size={20} />}>
      <div className="ai-node-field">
        <Tabs value={operation} onValueChange={(v) => handleChange('operation', v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="generate" className="flex-1">Generate</TabsTrigger>
            <TabsTrigger value="edit" className="flex-1">Edit</TabsTrigger>
            <TabsTrigger value="variation" className="flex-1">Variation</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Prompt Section - Only for generate and edit */}
      {operation !== 'variation' && (
        <CollapsibleSection title="Prompt" icon={<MessageSquare size={14} />} defaultOpen={true}>
          <div className="ai-node-field">
            <label className="ai-node-field-label">Prompt</label>
            <textarea className="ai-node-input ai-node-textarea nodrag" rows={3} value={data.prompt || ''} onChange={(e) => handleChange('prompt', e.target.value)} placeholder="Describe the image..." />
          </div>
        </CollapsibleSection>
      )}

      {/* Model Section */}
      <CollapsibleSection title="Model Settings" icon={<Settings size={14} />} defaultOpen={true}>
        <div className="ai-node-field">
          <label className="ai-node-field-label">Model</label>
          <ModelSelector
            value={data.model || 'dall-e-3'}
            mode={'image' as GenerationMode}
            onChange={(id) => handleChange('model', id)}
            allowCustomId
          />
        </div>
      </CollapsibleSection>

      {/* Basic Settings */}
      <CollapsibleSection title="Basic Settings" icon={<Sliders size={14} />} defaultOpen={true}>
        <div className="ai-node-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label className="ai-node-field-label">Size</label>
            <Input value={data.size || '1024x1024'} onChange={(e) => handleChange('size', (e.target as HTMLInputElement).value)} />
          </div>
          <div>
            <label className="ai-node-field-label">Count</label>
            <Input type="number" value={data.n ?? 1} onChange={(e) => handleChange('n', parseInt((e.target as HTMLInputElement).value))} min={1} max={10} />
          </div>
        </div>
        {(data.model && !data.model.includes('/')) && (
          <div className="ai-node-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label className="ai-node-field-label">Quality</label>
              <Select value={data.quality || 'standard'} onValueChange={(v)=>handleChange('quality', v as any)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="quality" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Quality</SelectLabel>
                    <SelectItem value="standard">standard</SelectItem>
                    <SelectItem value="hd">hd</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="ai-node-field-label">Style</label>
              <Select value={data.style || 'natural'} onValueChange={(v)=>handleChange('style', v as any)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="style" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Style</SelectLabel>
                    <SelectItem value="natural">natural</SelectItem>
                    <SelectItem value="vivid">vivid</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Advanced Settings - Together models */}
      {(data.model && data.model.includes('/')) && (
        <CollapsibleSection title="Advanced Settings" icon={<Sliders size={14} />} defaultOpen={false}>
          <div className="ai-node-field">
            <label className="ai-node-field-label">Together Settings</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Input placeholder="steps" type="number" value={data.steps ?? ''} onChange={(e) => handleChange('steps', (e.target as HTMLInputElement).value ? parseInt((e.target as HTMLInputElement).value) : undefined)} />
              <Input placeholder="seed" type="number" value={data.seed ?? ''} onChange={(e) => handleChange('seed', (e.target as HTMLInputElement).value ? parseInt((e.target as HTMLInputElement).value) : undefined)} />
              <Input placeholder="aspect ratio (e.g. 16:9)" value={data.aspectRatio || ''} onChange={(e) => handleChange('aspectRatio', (e.target as HTMLInputElement).value || undefined)} />
              <Input placeholder="reference image URL" value={data.referenceUrl || ''} onChange={(e) => handleChange('referenceUrl', (e.target as HTMLInputElement).value)} />
            </div>
            <Input style={{ marginTop: 6 }} placeholder="negative prompt" value={data.negativePrompt || ''} onChange={(e) => handleChange('negativePrompt', (e.target as HTMLInputElement).value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
              <Select value={data.responseFormat || 'url'} onValueChange={(v) => handleChange('responseFormat', v as any)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="response format" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Format</SelectLabel>
                    <SelectItem value="url">url</SelectItem>
                    <SelectItem value="b64_json">b64_json</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Switch checked={!!data.disableSafetyChecker} onCheckedChange={(v) => handleChange('disableSafetyChecker', v)} />
                <span style={{ fontSize: 12, color: '#bbb' }}>Disable safety</span>
              </div>
            </div>
            <textarea className="ai-node-input ai-node-textarea nodrag" rows={2} placeholder="image_loras (JSON array)" value={data.imageLorasJson || ''} onChange={(e) => handleChange('imageLorasJson', (e.target as HTMLTextAreaElement).value)} />
          </div>
        </CollapsibleSection>
      )}

      {/* Image Sources - Only for edit and variation */}
      {(operation === 'edit' || operation === 'variation') && (
        <CollapsibleSection title="Image Sources" icon={<ImageImg size={14} />} defaultOpen={true}>
          <div className="ai-node-field">
            <ImageSourceSelector
              value={data.sourceImage || ''}
              onUpdate={(v) => handleChange('sourceImage', v)}
              availableImages={availableImages}
              label={operation === 'variation' ? 'Base Image' : 'Source Image'}
              required
            />
            {operation === 'edit' && (
              <div style={{ marginTop: 8 }}>
                <ImageSourceSelector
                  value={data.maskImage || ''}
                  onUpdate={(v) => handleChange('maskImage', v)}
                  availableImages={availableImages}
                  label="Mask (optional)"
                />
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Results Section */}
      {(testResult || data.result) && (
        <CollapsibleSection title="Result" icon={<FileText size={14} />} defaultOpen={true}>
          <div className="ai-node-field">
            <div className="max-h-[200px] overflow-y-auto px-3 py-2 bg-black/30 rounded-md border border-green-500/30 text-[13px] text-zinc-200">
              {(() => {
                const r = (testResult || data.result) as any;
                if (r?.type === 'image') {
                  if (r.loading) return <div style={{ color: '#aaa' }}>Generating image…</div>;
                  if (r.image) return <img src={r.image} alt="Generated" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 6 }} />;
                }
                if (r?.error) return <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>Error: {r.error}</pre>;
                return null;
              })()}
            </div>
          </div>
        </CollapsibleSection>
      )}

      <div className="ai-node-field" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Button onClick={handleTest} disabled={isTesting} variant="success" className="flex-1">
          <Play size={14} /> {isTesting ? 'Testing…' : 'Test'}
        </Button>
        <Button onClick={handleDelete} variant="outline">
          <Trash2 size={14} />
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

export const ImageGenerationNode = React.memo(ImageGenerationNodeComponent);
ImageGenerationNode.displayName = 'ImageGenerationNode';

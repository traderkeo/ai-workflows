import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Film } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import type { VideoGenerationNodeData } from '../types';
import { Button } from '../components/ui/Button';

const VideoGenerationNodeComponent: React.FC<NodeProps> = (props) => {
  const data = props.data as VideoGenerationNodeData;
  const updateNode = useFlowStore((s) => s.updateNode);
  const deleteNode = useFlowStore((s) => s.deleteNode);

  const handleChange = (field: keyof VideoGenerationNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  const handleDelete = () => {
    if (confirm('Delete this node?')) deleteNode(props.id);
  };

  return (
    <BaseAINode {...props} data={data} icon={<Film size={20} />}>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Prompt</label>
        <textarea className="ai-node-input ai-node-textarea" rows={3} value={data.prompt || ''} onChange={(e) => handleChange('prompt', e.target.value)} placeholder="Describe the video… (scaffold)" />
      </div>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Model</label>
        <input className="ai-node-input" value={data.model || ''} onChange={(e) => handleChange('model', e.target.value)} placeholder="Enter future video model id" />
      </div>
      <div className="ai-node-field">
        <div className="ai-node-field-value" style={{ fontSize: 12, color: '#bbb' }}>
          Coming soon: Hook up to workers-ai video generation once available.
        </div>
      </div>
      <div className="ai-node-field" style={{ display: 'flex', gap: 8 }}>
        <Button disabled className="flex-1" variant="outline">Test (disabled)</Button>
        <Button onClick={handleDelete} variant="outline">Delete</Button>
      </div>
    </BaseAINode>
  );
};

export const VideoGenerationNode = React.memo(VideoGenerationNodeComponent);
VideoGenerationNode.displayName = 'VideoGenerationNode';

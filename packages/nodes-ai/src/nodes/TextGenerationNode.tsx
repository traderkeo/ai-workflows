import React from 'react';
import { NodeProps } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import type { TextGenerationNodeData } from '../types';

export const TextGenerationNode: React.FC<NodeProps> = (props) => {
  const data = props.data as TextGenerationNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);

  const handleChange = (field: keyof TextGenerationNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  return (
    <BaseAINode {...props} data={data} icon={<MessageSquare size={20} />}>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Prompt</label>
        <textarea
          className="ai-node-input ai-node-textarea"
          value={data.prompt || ''}
          onChange={(e) => handleChange('prompt', e.target.value)}
          placeholder="Enter your prompt..."
          rows={4}
        />
      </div>

      <div className="ai-node-field">
        <label className="ai-node-field-label">Model</label>
        <select
          className="ai-node-select"
          value={data.model || 'gpt-4o-mini'}
          onChange={(e) => handleChange('model', e.target.value)}
        >
          <option value="gpt-4o">GPT-4o (Most Capable)</option>
          <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>

      <div className="ai-node-field">
        <label className="ai-node-field-label">Temperature</label>
        <input
          type="number"
          className="ai-node-input"
          value={data.temperature ?? 0.7}
          onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
          min="0"
          max="2"
          step="0.1"
        />
      </div>

      <div className="ai-node-field">
        <label className="ai-node-field-label">Max Tokens</label>
        <input
          type="number"
          className="ai-node-input"
          value={data.maxTokens ?? 1000}
          onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
          min="1"
          max="4000"
        />
      </div>

      {data.systemPrompt !== undefined && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">System Prompt</label>
          <textarea
            className="ai-node-input ai-node-textarea"
            value={data.systemPrompt || ''}
            onChange={(e) => handleChange('systemPrompt', e.target.value)}
            placeholder="Optional system prompt..."
            rows={2}
          />
        </div>
      )}

      {data.result && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Result</label>
          <div className="ai-node-field-value" style={{
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: '1px solid rgba(176, 38, 255, 0.3)'
          }}>
            {data.result}
          </div>
        </div>
      )}

      {data.usage && (
        <div className="ai-node-field">
          <label className="ai-node-field-label">Token Usage</label>
          <div className="ai-node-field-value">
            {data.usage.totalTokens} tokens (
            {data.usage.promptTokens} prompt + {data.usage.completionTokens} completion)
          </div>
        </div>
      )}
    </BaseAINode>
  );
};

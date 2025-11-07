import React from 'react';
import { NodeProps } from '@xyflow/react';
import { GitMerge } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/Select';

export interface MergeNodeData {
  label: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  mergeStrategy: 'object' | 'array' | 'concat';
  result?: any;
  executionTime?: number;
}

const MergeNodeComponent: React.FC<NodeProps> = (props) => {
  const data = props.data as unknown as MergeNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);

  const handleChange = (field: keyof MergeNodeData, value: any) => {
    updateNode(props.id, { [field]: value });
  };

  return (
    <BaseAINode {...props} data={data} icon={<GitMerge size={20} />}>
      <div className="ai-node-field">
        <label className="ai-node-field-label">Merge Strategy</label>
        <Select value={data.mergeStrategy || 'object'} onValueChange={(v) => handleChange('mergeStrategy', v)}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Select strategy" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="object">Object (Key-Value Pairs)</SelectItem>
            <SelectItem value="array">Array (List)</SelectItem>
            <SelectItem value="concat">Concat (Join Text)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
        <div className="ai-node-field-value" style={{
          padding: '8px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '0.01em',
          color: '#888',
        }}>
          {data.mergeStrategy === 'object' && '→ Combines inputs as {input1: value1, input2: value2}'}
          {data.mergeStrategy === 'array' && '→ Combines inputs as [value1, value2, value3]'}
          {data.mergeStrategy === 'concat' && '→ Joins inputs as "value1\\n\\nvalue2\\n\\nvalue3"'}
        </div>
      </div>

      {data.result && (
        <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
          <label className="ai-node-field-label" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>Merged Result</label>
          <div className="ai-node-field-value" style={{
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: '1px solid rgba(176, 38, 255, 0.3)',
            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}>
            {typeof data.result === 'string'
              ? data.result
              : JSON.stringify(data.result, null, 2)}
          </div>
        </div>
      )}
    </BaseAINode>
  );
};

export const MergeNode = React.memo(MergeNodeComponent);
MergeNode.displayName = 'MergeNode';

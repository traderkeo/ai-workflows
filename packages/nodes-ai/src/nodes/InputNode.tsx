import React from 'react';
import { NodeProps } from '@xyflow/react';
import { PlayCircle } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import type { StartNodeData } from '../types';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '../components/ui/Select';

export const InputNode: React.FC<NodeProps> = (props) => {
  const data = props.data as StartNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);

  const handleValueChange = (value: string) => {
    let parsedValue: any = value;

    // Try to parse based on valueType
    try {
      if (data.valueType === 'number') {
        parsedValue = parseFloat(value);
      } else if (data.valueType === 'object' || data.valueType === 'array') {
        parsedValue = JSON.parse(value);
      }
    } catch (e) {
      // Keep as string if parsing fails
    }

    updateNode(props.id, { value: parsedValue });
  };

  const handleTypeChange = (type: StartNodeData['valueType']) => {
    updateNode(props.id, { valueType: type });
  };

  const displayValue =
    typeof data.value === 'object'
      ? JSON.stringify(data.value, null, 2)
      : String(data.value || '');

  return (
    <BaseAINode
      {...props}
      data={data}
      icon={<PlayCircle size={20} />}
      hasInput={false}
      hasOutput={true}
    >
      <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
        <label className="ai-node-field-label" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>Value Type</label>
        <Select value={data.valueType} onValueChange={(v) => handleTypeChange(v as StartNodeData['valueType'])}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Types</SelectLabel>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="object">Object</SelectItem>
              <SelectItem value="array">Array</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
        <label className="ai-node-field-label" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>Value</label>
        <textarea
          className="ai-node-input ai-node-textarea"
          value={displayValue}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={`Enter ${data.valueType} value...`}
          rows={4}
          style={{
            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}
        />
      </div>
    </BaseAINode>
  );
};

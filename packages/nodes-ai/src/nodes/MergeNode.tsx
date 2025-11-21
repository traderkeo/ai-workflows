import React from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { GitMerge } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';

export interface MergeNodeData {
  label: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  mergeStrategy: 'object' | 'array' | 'concat';
  result?: any;
  executionTime?: number;
}

const MergeNodeComponent: React.FC<NodeProps> = (props) => {
  const data = props.data as unknown as MergeNodeData;

  return (
    <BaseAINode {...props} data={data} icon={<GitMerge size={20} />} hasInput={false}>
      {/* Informational text based on merge strategy */}
      <div style={{ 
        fontSize: '11px', 
        color: '#a1a1aa', 
        padding: '8px',
        background: 'rgba(39, 39, 42, 0.5)',
        borderRadius: '4px',
        marginBottom: '8px',
      }}>
        {data.mergeStrategy === 'object' && '→ Combines inputs as {input1: value1, input2: value2}'}
        {data.mergeStrategy === 'array' && '→ Combines inputs as [value1, value2, value3]'}
        {data.mergeStrategy === 'concat' && '→ Joins inputs as "value1\\n\\nvalue2\\n\\nvalue3"'}
      </div>

      {/* Results only - all settings in right panel */}
      {data.result && (
        <div className="ai-node-field" style={{ marginTop: 8 }}>
          <div style={{
            padding: '8px',
            background: 'rgba(39, 39, 42, 0.8)',
            borderRadius: '4px',
            border: '1px solid rgba(63, 63, 70, 0.5)',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#e4e4e7',
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {typeof data.result === 'string'
                ? data.result
                : JSON.stringify(data.result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Input Handles - Both sides for logic nodes */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#4a4a5a' }}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Right}
        style={{ background: '#4a4a5a' }}
        isConnectable={true}
      />
    </BaseAINode>
  );
};

export const MergeNode = React.memo(MergeNodeComponent);
MergeNode.displayName = 'MergeNode';

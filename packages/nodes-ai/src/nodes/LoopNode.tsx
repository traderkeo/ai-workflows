import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { RotateCw } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import type { LoopNodeData } from '../types';
import { useFlowStore } from '../hooks/useFlowStore';

export const LoopNode: React.FC<NodeProps> = (props) => {
  const { data } = props;
  const nodeData = data as LoopNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);

  const [loopType, setLoopType] = useState<LoopNodeData['loopType']>(nodeData.loopType || 'count');
  const [count, setCount] = useState(String(nodeData.count ?? 5));
  const [conditionCode, setConditionCode] = useState(nodeData.conditionCode || 'return iteration < 10;');

  const handleLoopTypeChange = (newType: LoopNodeData['loopType']) => {
    setLoopType(newType);
    updateNode(props.id, { loopType: newType });
  };

  const handleCountChange = () => {
    const numCount = parseInt(count, 10);
    if (!isNaN(numCount) && numCount > 0) {
      updateNode(props.id, { count: numCount });
    }
  };

  const handleConditionChange = () => {
    updateNode(props.id, { conditionCode });
  };

  return (
    <BaseAINode {...props} data={nodeData} icon={<RotateCw size={16} />}>
      <div className="ai-node-field">
        <span className="ai-node-field-label">Loop Type</span>
        <select
          className="ai-node-input"
          value={loopType}
          onChange={(e) => handleLoopTypeChange(e.target.value as LoopNodeData['loopType'])}
        >
          <option value="count">Fixed Count</option>
          <option value="array">Iterate Array</option>
          <option value="condition">Conditional</option>
        </select>
      </div>

      {loopType === 'count' && (
        <div className="ai-node-field">
          <span className="ai-node-field-label">Iterations</span>
          <input
            type="number"
            className="ai-node-input"
            placeholder="5"
            value={count}
            min="1"
            onChange={(e) => setCount(e.target.value)}
            onBlur={handleCountChange}
          />
        </div>
      )}

      {loopType === 'array' && (
        <div className="ai-node-field">
          <span className="ai-node-field-label">Array Source</span>
          <div className="ai-node-field-value" style={{ fontSize: '11px', color: 'var(--cyber-neon-purple)' }}>
            {'Use {{input}} or {{nodeId}} to pass an array'}
          </div>
        </div>
      )}

      {loopType === 'condition' && (
        <div className="ai-node-field">
          <span className="ai-node-field-label">Condition (JavaScript)</span>
          <textarea
            className="ai-node-input"
            placeholder="return iteration < 10;"
            value={conditionCode}
            onChange={(e) => setConditionCode(e.target.value)}
            onBlur={handleConditionChange}
            rows={3}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          />
          <div style={{ fontSize: '10px', color: 'var(--cyber-neon-purple)', marginTop: '4px' }}>
            Available: iteration, input
          </div>
        </div>
      )}

      {nodeData.currentIteration !== undefined && (
        <div className="ai-node-field">
          <span className="ai-node-field-label">Current Iteration</span>
          <div className="ai-node-field-value">{nodeData.currentIteration}</div>
        </div>
      )}

      {nodeData.results && nodeData.results.length > 0 && (
        <div className="ai-node-field">
          <span className="ai-node-field-label">Results</span>
          <div className="ai-node-field-value">
            <pre
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                maxHeight: '150px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(nodeData.results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </BaseAINode>
  );
};

import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Play, Loader2 } from 'lucide-react';
import { BaseAINode } from '../components/BaseAINode';
import { useFlowStore } from '../hooks/useFlowStore';
import { Button } from '../components/ui/Button';

export interface StartNodeData {
  label: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  value: any;
  valueType: 'string' | 'number' | 'object' | 'array';
  executionTime?: number;
}

const StartNodeComponent: React.FC<NodeProps> = (props) => {
  const data = props.data as unknown as StartNodeData;
  const updateNode = useFlowStore((state) => state.updateNode);
  const [isTesting, setIsTesting] = useState(false);

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

  const handleTest = async () => {
    setIsTesting(true);
    updateNode(props.id, { status: 'running' });
    const startTime = Date.now();

    try {
      // Simulate a quick validation/test of the data
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Validate the data based on type
      let isValid = true;
      if (data.valueType === 'number' && isNaN(Number(data.value))) {
        isValid = false;
      } else if ((data.valueType === 'object' || data.valueType === 'array') && data.value) {
        try {
          JSON.parse(typeof data.value === 'string' ? data.value : JSON.stringify(data.value));
        } catch {
          isValid = false;
        }
      }

      const executionTime = Date.now() - startTime;
      
      if (isValid) {
        updateNode(props.id, { 
          status: 'success',
          executionTime 
        });
      } else {
        updateNode(props.id, { 
          status: 'error',
          executionTime 
        });
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      updateNode(props.id, { 
        status: 'error',
        executionTime 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const displayValue =
    typeof data.value === 'object'
      ? JSON.stringify(data.value, null, 2)
      : String(data.value || '');

  const status = data.status || 'idle';
  
  // Status colors and labels
  const statusColors: Record<string, string> = {
    idle: '#4a4a5a',
    running: '#00f0ff',
    success: '#39ff14',
    error: '#ff0040',
    warning: '#ffff00',
  };

  const statusLabels: Record<string, string> = {
    idle: 'Idle',
    running: 'Running',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
  };

  const statusColor = statusColors[status];

  // Custom footer with status badge and execution time
  const customFooter = data.executionTime !== undefined && (
    <div className="ai-node-footer" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      paddingTop: '10px',
      paddingBottom: '10px',
      fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)',
    }}>
      {/* Group badge + execution time together */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            color: statusColor,
            borderColor: statusColor,
            boxShadow: `0 0 5px ${statusColor}`,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontWeight: 500,
            padding: '3px 8px',
            border: '1px solid',
            borderRadius: '4px',
            fontFamily: 'inherit',
            letterSpacing: '0.01em',
          }}
        >
          {status === 'running' && <Loader2 size={10} className="animate-spin" />}
          {statusLabels[status]}
        </div>
        <span style={{ 
          fontSize: '10px', 
          fontWeight: 400,
          color: 'var(--text-muted, #888)',
          fontFamily: 'inherit',
          letterSpacing: '0.01em',
        }}>
          Execution Time: {data.executionTime}ms
        </span>
      </div>
    </div>
  );

  return (
    <BaseAINode
      {...props}
      data={data}
      icon={<Play size={20} />}
      hasInput={false}
      hasOutput={true}
      footerContent={customFooter}
    >
      {/* Type Badge Row */}
      <div className="ai-node-field flex items-center gap-2" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
        <button
          disabled
          className="text-xs px-3 py-1.5 rounded-md transition-colors bg-cyan-600/40 text-cyan-300 border border-cyan-500/50"
          style={{
            fontWeight: 600,
            letterSpacing: '0.05em',
            fontFamily: 'inherit',
            textTransform: 'uppercase',
          }}
        >
          {data.valueType === 'string' ? 'TEXT' : data.valueType === 'number' ? 'NUMBER' : data.valueType === 'object' ? 'OBJECT' : 'ARRAY'}
        </button>
      </div>

      {/* Initial Data - Styled similar to Prompt field */}
      <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
        <div className="text-xs text-zinc-400 mb-1.5" style={{ fontWeight: 500, letterSpacing: '0.01em' }}>Initial Data</div>
        <textarea
          className="nodrag"
          value={displayValue}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="Enter starting data for workflow..."
          rows={3}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            border: '1px solid rgba(0, 242, 255, 0.2)',
            color: 'var(--text-primary, #e5e5e5)',
            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '0.01em',
            resize: 'vertical',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 242, 255, 0.5)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 242, 255, 0.2)';
          }}
        />
      </div>

      {/* Data Type Selector */}
      <div className="ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
        <div className="text-xs text-zinc-400 mb-1.5" style={{ fontWeight: 500, letterSpacing: '0.01em' }}>Data Type</div>
        <select
          className="nodrag"
          value={data.valueType}
          onChange={(e) => handleTypeChange(e.target.value as StartNodeData['valueType'])}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            border: '1px solid rgba(176, 38, 255, 0.2)',
            color: 'var(--text-primary, #e5e5e5)',
            fontFamily: 'inherit',
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '0.01em',
            outline: 'none',
            cursor: 'pointer',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.5)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.2)';
          }}
        >
          <option value="string">Text</option>
          <option value="number">Number</option>
          <option value="object">JSON Object</option>
          <option value="array">Array</option>
        </select>
      </div>

      {/* Test Button */}
      <div className="hidden ai-node-field flex items-center gap-2">
        <Button
          onClick={handleTest}
          disabled={isTesting}
          variant="success"
          size="sm"
          className="flex-1 rounded-full"
        >
          <Play size={14} />
          {isTesting ? 'Testing...' : 'Test'}
        </Button>
      </div>

      {/* Output Preview - Show when data exists */}
      {data.value !== undefined && data.value !== '' && (
        <div className="hidden ai-node-field" style={{ fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)' }}>
          <div className="text-xs text-zinc-400 mb-1.5" style={{ fontWeight: 500, letterSpacing: '0.01em' }}>Output</div>
          <div className="max-h-[100px] overflow-y-auto px-3 py-2 bg-black/30 rounded-md border border-green-500/30 text-[13px] text-zinc-200" style={{
            fontFamily: 'var(--font-geist-mono, "Geist Mono", "JetBrains Mono", monospace)',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}>
            <pre className="whitespace-pre-wrap break-words m-0" style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}>
              {typeof data.value === 'object'
                ? JSON.stringify(data.value, null, 2)
                : String(data.value)}
            </pre>
          </div>
        </div>
      )}
    </BaseAINode>
  );
};

export const StartNode = React.memo(StartNodeComponent);
StartNode.displayName = 'StartNode';

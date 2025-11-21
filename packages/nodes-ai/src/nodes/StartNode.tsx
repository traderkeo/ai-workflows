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

  const testButton = (
    <button
      onClick={handleTest}
      disabled={isTesting}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: 'rgba(39, 39, 42, 0.8)',
        border: '1px solid rgba(161, 161, 170, 0.3)',
        borderRadius: '6px',
        color: 'rgb(228, 228, 231)',
        fontSize: '12px',
        fontWeight: 500,
        fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
        cursor: isTesting ? 'not-allowed' : 'pointer',
        opacity: isTesting ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!isTesting) {
          e.currentTarget.style.background = 'rgba(161, 161, 170, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(161, 161, 170, 0.5)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isTesting) {
          e.currentTarget.style.background = 'rgba(39, 39, 42, 0.8)';
          e.currentTarget.style.borderColor = 'rgba(161, 161, 170, 0.3)';
        }
      }}
    >
      <Play size={14} strokeWidth={2} />
      {isTesting ? 'Testing...' : 'Test'}
    </button>
  );

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
      headerActions={testButton}
    >
      {/* Settings Info - White Text */}
      <div style={{ marginBottom: 8, fontSize: '11px', fontFamily: 'monospace', color: '#e4e4e7' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.value !== undefined && data.value !== '' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <span style={{ color: '#71717a', flexShrink: 0 }}>value:</span>
              <span style={{ color: '#e4e4e7', wordBreak: 'break-word', maxWidth: '100%' }}>
                {typeof data.value === 'object'
                  ? JSON.stringify(data.value).length > 30 
                    ? `${JSON.stringify(data.value).substring(0, 30)}...` 
                    : JSON.stringify(data.value)
                  : String(data.value).length > 30 
                    ? `${String(data.value).substring(0, 30)}...` 
                    : String(data.value)}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#71717a' }}>type:</span>
            <span style={{ color: '#e4e4e7' }}>{data.valueType}</span>
          </div>
        </div>
      </div>
    </BaseAINode>
  );
};

export const StartNode = React.memo(StartNodeComponent);
StartNode.displayName = 'StartNode';

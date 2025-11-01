import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../styles/index.css';

import { useFlowStore } from '../hooks/useFlowStore';
import { InputNode } from '../nodes/InputNode';
import { OutputNode } from '../nodes/OutputNode';
import { TextGenerationNode } from '../nodes/TextGenerationNode';
import { StructuredDataNode } from '../nodes/StructuredDataNode';
import { TransformNode } from '../nodes/TransformNode';
import { executeWorkflow, validateWorkflow } from '../utils/executionEngine';
import { Play, Save, Upload, Download, Trash2, AlertCircle } from 'lucide-react';
import type { AINode } from '../types';

const nodeTypes = {
  input: InputNode,
  output: OutputNode,
  'text-generation': TextGenerationNode,
  'structured-data': StructuredDataNode,
  transform: TransformNode,
};

export const WorkflowCanvas: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    updateNode,
    resetWorkflow,
    exportWorkflow,
    importWorkflow,
    isExecuting,
    startExecution,
    stopExecution,
    metadata,
    updateMetadata,
  } = useFlowStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fitView } = useReactFlow();

  const handleExecute = useCallback(async () => {
    // Validate workflow
    const validation = validateWorkflow(nodes, edges);
    if (!validation.valid) {
      alert(`Workflow validation failed:\n\n${validation.errors.join('\n')}`);
      return;
    }

    startExecution();

    try {
      await executeWorkflow(nodes, edges, (nodeId, updates) => {
        updateNode(nodeId, updates);
      });

      alert('Workflow executed successfully!');
    } catch (error: any) {
      alert(`Workflow execution failed: ${error.message}`);
    } finally {
      stopExecution();
    }
  }, [nodes, edges, updateNode, startExecution, stopExecution]);

  const handleSave = useCallback(() => {
    const json = exportWorkflow();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportWorkflow, metadata.name]);

  const handleLoad = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          importWorkflow(json);
          setTimeout(() => fitView(), 100);
          alert('Workflow loaded successfully!');
        } catch (error) {
          alert('Failed to load workflow. Invalid file format.');
        }
      };
      reader.readAsText(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [importWorkflow, fitView]
  );

  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to reset the workflow? This cannot be undone.')) {
      resetWorkflow();
    }
  }, [resetWorkflow]);

  const handleNameChange = useCallback(() => {
    const newName = prompt('Enter workflow name:', metadata.name);
    if (newName && newName.trim()) {
      updateMetadata({ name: newName.trim() });
    }
  }, [metadata.name, updateMetadata]);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 2 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          pannable
          zoomable
          style={{
            backgroundColor: 'var(--gothic-charcoal)',
          }}
        />

        {/* Top Panel - Workflow Info & Controls */}
        <Panel position="top-left" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            className="gothic-panel"
            style={{
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div>
              <div
                onClick={handleNameChange}
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--cyber-neon-cyan)',
                  cursor: 'pointer',
                  textShadow: '0 0 10px var(--cyber-neon-cyan)',
                }}
              >
                {metadata.name}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--cyber-neon-purple)',
                  marginTop: '2px',
                }}
              >
                {nodes.length} nodes • {edges.length} connections
              </div>
            </div>
          </div>
        </Panel>

        {/* Top Panel - Action Buttons */}
        <Panel position="top-right" style={{ display: 'flex', gap: '8px' }}>
          <button
            className="ai-node-button"
            onClick={handleExecute}
            disabled={isExecuting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isExecuting ? 0.5 : 1,
              cursor: isExecuting ? 'not-allowed' : 'pointer',
            }}
          >
            <Play size={14} />
            {isExecuting ? 'Running...' : 'Execute'}
          </button>

          <button
            className="ai-node-button"
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #00f0ff 0%, #b026ff 100%)',
            }}
          >
            <Download size={14} />
            Export
          </button>

          <button
            className="ai-node-button"
            onClick={handleLoad}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #39ff14 0%, #00f0ff 100%)',
            }}
          >
            <Upload size={14} />
            Import
          </button>

          <button
            className="ai-node-button"
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #ff0040 0%, #ff1493 100%)',
            }}
          >
            <Trash2 size={14} />
            Reset
          </button>
        </Panel>

        {/* Bottom Panel - Instructions */}
        <Panel position="bottom-center">
          <div
            className="gothic-panel"
            style={{
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--cyber-neon-purple)',
            }}
          >
            <AlertCircle size={14} />
            Right-click canvas to add nodes • Connect nodes by dragging from handles • Double-click node name to edit workflow name
          </div>
        </Panel>
      </ReactFlow>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </>
  );
};

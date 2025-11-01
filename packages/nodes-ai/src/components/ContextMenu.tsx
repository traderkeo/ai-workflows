import React from 'react';
import {
  PlayCircle,
  CheckCircle,
  MessageSquare,
  Database,
  Code2,
  Workflow,
  GitBranch,
} from 'lucide-react';
import { useFlowStore } from '../hooks/useFlowStore';
import type { AINode, AINodeType } from '../types';

interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  canvasPosition: { x: number; y: number };
  zoom: number;
}

interface NodeTemplate {
  type: AINodeType;
  label: string;
  icon: React.ReactNode;
  defaultData: any;
}

const nodeTemplates: NodeTemplate[] = [
  {
    type: 'input',
    label: 'Input',
    icon: <PlayCircle size={16} />,
    defaultData: {
      label: 'Input',
      value: '',
      valueType: 'string',
      status: 'idle',
    },
  },
  {
    type: 'output',
    label: 'Output',
    icon: <CheckCircle size={16} />,
    defaultData: {
      label: 'Output',
      status: 'idle',
    },
  },
  {
    type: 'text-generation',
    label: 'Text Generation',
    icon: <MessageSquare size={16} />,
    defaultData: {
      label: 'Text Generation',
      prompt: '',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
      status: 'idle',
    },
  },
  {
    type: 'structured-data',
    label: 'Structured Data',
    icon: <Database size={16} />,
    defaultData: {
      label: 'Structured Data',
      prompt: '',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      schemaName: '',
      status: 'idle',
    },
  },
  {
    type: 'transform',
    label: 'Transform',
    icon: <Code2 size={16} />,
    defaultData: {
      label: 'Transform',
      transformCode: '// Transform code here\nreturn input;',
      status: 'idle',
    },
  },
];

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  onClose,
  canvasPosition,
  zoom,
}) => {
  const addNode = useFlowStore((state) => state.addNode);

  const handleAddNode = (template: NodeTemplate) => {
    // Convert screen coordinates to canvas coordinates
    const x = (position.x - canvasPosition.x) / zoom;
    const y = (position.y - canvasPosition.y) / zoom;

    const newNode: AINode = {
      id: `${template.type}-${Date.now()}`,
      type: template.type,
      position: { x, y },
      data: template.defaultData,
    };

    addNode(newNode);
    onClose();
  };

  return (
    <div
      className="gothic-panel"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 1000,
        minWidth: '200px',
        padding: '8px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          fontFamily: 'var(--font-primary)',
          fontSize: '11px',
          color: 'var(--cyber-neon-purple)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '8px',
          paddingLeft: '8px',
        }}
      >
        Add Node
      </div>

      {nodeTemplates.map((template) => (
        <button
          key={template.type}
          onClick={() => handleAddNode(template)}
          className="node-toolbar-button"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            marginBottom: '4px',
            textAlign: 'left',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
          }}
        >
          {template.icon}
          {template.label}
        </button>
      ))}
    </div>
  );
};

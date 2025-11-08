import React from 'react';
import {
  Play,
  StopCircle,
  Bot,
  MessageSquare,
  Database,
  Code2,
  GitMerge,
  GitBranch,
  Globe,
  RotateCw,
  Upload,
  Image as ImageIcon,
  Volume2,
  Film,
  ListFilter,
} from 'lucide-react';
import { Scissors, Layers, HardDrive, ShieldCheck, FileText, Search } from 'lucide-react';
import { useFlowStore } from '../hooks/useFlowStore';
import type { AINode, AINodeType } from '../types';

interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  canvasPosition: { x: number; y: number };
  zoom: number;
}

export interface NodeTemplate {
  type: AINodeType;
  label: string;
  icon: React.ReactNode;
  defaultData: any;
}

export const nodeTemplates: NodeTemplate[] = [
  {
    type: 'start',
    label: 'Start',
    icon: <Play size={16} />,
    defaultData: {
      label: 'Start',
      value: '',
      valueType: 'string',
      status: 'idle',
    },
  },
  {
    type: 'stop',
    label: 'Stop',
    icon: <StopCircle size={16} />,
    defaultData: {
      label: 'Stop',
      status: 'idle',
    },
  },
  {
    type: 'ai-agent',
    label: 'AI Agent',
    icon: <Bot size={16} />,
    defaultData: {
      label: 'AI Agent',
      mode: 'text',
      prompt: '',
      instructions: '',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
      status: 'idle',
    },
  },
  {
    type: 'generate',
    label: 'Generate',
    icon: <MessageSquare size={16} />,
    defaultData: {
      label: 'Generate',
      mode: 'text',
      prompt: '',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
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
  {
    type: 'merge',
    label: 'Merge',
    icon: <GitMerge size={16} />,
    defaultData: {
      label: 'Merge',
      mergeStrategy: 'object',
      status: 'idle',
    },
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: <GitBranch size={16} />,
    defaultData: {
      label: 'Condition',
      conditionType: 'length',
      input: '{{input}}',
      minLength: 100,
      status: 'idle',
    },
  },
  {
    type: 'template',
    label: 'Template',
    icon: <FileText size={16} />,
    defaultData: {
      label: 'Template',
      template: 'Use {{input}} to insert data here...',
      status: 'idle',
    },
  },
  
  // Image generation
  {
    type: 'image-generation',
    label: 'Image Generation',
    icon: <ImageIcon size={16} />,
    defaultData: {
      label: 'Image Generation',
      operation: 'generate',
      prompt: '',
      model: 'dall-e-3',
      size: '1024x1024',
      status: 'idle',
    },
  },
  // Audio TTS
  {
    type: 'audio-tts',
    label: 'Audio TTS',
    icon: <Volume2 size={16} />,
    defaultData: {
      label: 'Audio TTS',
      text: '',
      model: 'tts-1',
      voice: 'alloy',
      speed: 1.0,
      status: 'idle',
    },
  },
  // Video (scaffold)
  {
    type: 'video-generation',
    label: 'Video Generation',
    icon: <Film size={16} />,
    defaultData: {
      label: 'Video Generation',
      prompt: '',
      model: '',
      status: 'idle',
    },
  },
  // Rerank (scaffold)
  {
    type: 'rerank',
    label: 'Rerank',
    icon: <ListFilter size={16} />,
    defaultData: {
      label: 'Rerank',
      query: '',
      candidates: '',
      topK: 5,
      model: '',
      status: 'idle',
    },
  },
  {
    type: 'http-request',
    label: 'HTTP Request',
    icon: <Globe size={16} />,
    defaultData: {
      label: 'HTTP Request',
      url: '',
      method: 'GET',
      headers: {},
      status: 'idle',
    },
  },
  {
    type: 'web-scrape',
    label: 'Web Scrape',
    icon: <Globe size={16} />,
    defaultData: {
      label: 'Web Scrape',
      url: '',
      extractText: true,
      status: 'idle',
    },
  },
  {
    type: 'web-search',
    label: 'Web Search',
    icon: <Search size={16} />,
    defaultData: {
      label: 'Web Search',
      query: '{{input}}',
      model: 'gpt-4o-mini',
      allowedDomains: '',
      includeSources: true,
      externalWebAccess: true,
      mode: 'nonreasoning',
      reasoningEffort: 'low',
      status: 'idle',
    },
  },
  {
    type: 'file-upload',
    label: 'File Upload Test',
    icon: <Upload size={16} />,
    defaultData: {
      label: 'File Upload Test',
      status: 'idle',
      files: [],
    },
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: <RotateCw size={16} />,
    defaultData: {
      label: 'Loop',
      loopType: 'count',
      count: 5,
      status: 'idle',
    },
  },
  {
    type: 'splitter',
    label: 'Splitter',
    icon: <Scissors size={16} />,
    defaultData: {
      label: 'Splitter',
      strategy: 'length',
      chunkSize: 500,
      overlap: 0,
      status: 'idle',
    },
  },
  {
    type: 'document-ingest',
    label: 'Document Ingest',
    icon: <FileText size={16} />,
    defaultData: {
      label: 'Document Ingest',
      sourceType: 'text',
      split: true,
      chunkSize: 1000,
      overlap: 0,
      status: 'idle',
    },
  },
  {
    type: 'retrieval-qa',
    label: 'Retrieval QA',
    icon: <Search size={16} />,
    defaultData: {
      label: 'Retrieval QA',
      queryTemplate: '{{input}}',
      topK: 3,
      model: 'gpt-4o-mini',
      temperature: 0.3,
      status: 'idle',
    },
  },
  {
    type: 'aggregator',
    label: 'Aggregator',
    icon: <Layers size={16} />,
    defaultData: {
      label: 'Aggregator',
      mode: 'concat-text',
      delimiter: '\n',
      status: 'idle',
    },
  },
  {
    type: 'cache',
    label: 'Cache',
    icon: <HardDrive size={16} />,
    defaultData: {
      label: 'Cache',
      keyTemplate: '{{input}}',
      operation: 'get',
      writeIfMiss: false,
      status: 'idle',
    },
  },
  {
    type: 'guardrail',
    label: 'Guardrail',
    icon: <ShieldCheck size={16} />,
    defaultData: {
      label: 'Guardrail',
      checks: { blocklist: true, pii: false, toxicity: false, regex: false },
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
  const nodes = useFlowStore((state) => state.nodes);

  const handleAddNode = (template: NodeTemplate) => {
    // Convert screen coordinates to canvas coordinates
    const x = (position.x - canvasPosition.x) / zoom;
    const y = (position.y - canvasPosition.y) / zoom;

    // Auto-generate node name
    const existingNodesOfType = nodes.filter(n => n.type === template.type);
    const nodeNumber = existingNodesOfType.length + 1;
    const autoGeneratedName = `${template.label.toLowerCase().replace(/\s+/g, '-')}-${nodeNumber}`;

    const newNode: AINode = {
      id: `${template.type}-${Date.now()}`,
      type: template.type,
      position: { x, y },
      data: {
        ...template.defaultData,
        name: autoGeneratedName,
      },
    };

    addNode(newNode);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        display: 'block',
        top: position.y,
        left: position.x,
        zIndex: 1000,
        minWidth: '240px',
        maxWidth: '300px',
        background: 'linear-gradient(135deg, var(--gothic-charcoal) 0%, var(--gothic-slate) 100%)',
        border: 'var(--border-glow) solid var(--cyber-neon-purple)',
        borderRadius: '8px',
        boxShadow: 'var(--node-shadow)',
        overflow: 'hidden',
        fontFamily: 'var(--font-primary)',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={(e) => {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'monochrome') {
          e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
        } else {
          e.currentTarget.style.boxShadow = '0 0 30px rgba(176, 38, 255, 0.5)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--node-shadow)';
      }}
    >
      {/* Header - Matching node header style */}
      <div
        style={{
          background: 'linear-gradient(90deg, var(--gothic-slate) 0%, var(--gothic-gray) 100%)',
          borderBottom: '1px solid var(--cyber-neon-purple)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontFamily: 'var(--font-primary)',
            fontWeight: 700,
            color: 'var(--cyber-neon-cyan)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            flex: 1,
          }}
        >
          Add Node
        </div>
      </div>

      {/* Menu Items - Styled like node content */}
      <div
        style={{
          padding: '8px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        {nodeTemplates.map((template, index) => (
          <button
            key={template.type}
            onClick={() => handleAddNode(template)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 12px',
              marginBottom: index < nodeTemplates.length - 1 ? '4px' : '0',
              textAlign: 'left',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: 'var(--cyber-neon-cyan)',
              fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)',
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => {
              const theme = document.documentElement.getAttribute('data-theme');
              if (theme === 'monochrome') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.15)';
              } else {
                e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(176, 38, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                color: 'var(--cyber-neon-cyan)',
                filter: 'drop-shadow(0 0 3px currentColor)',
              }}
            >
              {template.icon}
            </div>
            <span
              style={{
                flex: 1,
                color: 'inherit',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: 'inherit',
              }}
            >
              {template.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

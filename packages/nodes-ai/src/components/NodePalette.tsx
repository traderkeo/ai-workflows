import React, { useState, useCallback } from 'react';
import { nodeTemplates, type NodeTemplate } from './ContextMenu';
import { useFlowStore } from '../hooks/useFlowStore';
import { useReactFlow } from '@xyflow/react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

// Categorize nodes
const nodeCategories: Record<string, { label: string; types: string[] }> = {
  triggers: {
    label: 'Triggers',
    types: ['start'],
  },
  actions: {
    label: 'Actions',
    types: ['generate', 'ai-agent', 'http-request', 'web-scrape', 'web-search', 'image-generation', 'audio-tts', 'video-generation'],
  },
  logic: {
    label: 'Logic',
    types: ['condition', 'merge', 'loop', 'splitter', 'aggregator'],
  },
  transform: {
    label: 'Transform',
    types: ['transform', 'template', 'rerank'],
  },
  data: {
    label: 'Data',
    types: ['file-upload', 'document-ingest', 'retrieval-qa', 'cache', 'guardrail'],
  },
  control: {
    label: 'Control',
    types: ['stop'],
  },
};

export const NodePalette: React.FC = () => {
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(Object.keys(nodeCategories))
  );
  const addNode = useFlowStore((s) => s.addNode);
  const { screenToFlowPosition } = useReactFlow();

  const toggleCategory = useCallback((category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const filteredTemplates = nodeTemplates.filter(
    (template) =>
      template.label.toLowerCase().includes(search.toLowerCase()) ||
      template.type.toLowerCase().includes(search.toLowerCase())
  );

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    for (const [categoryKey, category] of Object.entries(nodeCategories)) {
      if (category.types.includes(template.type)) {
        if (!acc[categoryKey]) {
          acc[categoryKey] = [];
        }
        acc[categoryKey].push(template);
        break;
      }
    }
    return acc;
  }, {} as Record<string, NodeTemplate[]>);

  const handleAddNode = useCallback((template: NodeTemplate) => {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const existingNodesOfType = useFlowStore.getState().nodes.filter(
      (n) => n.type === template.type
    );
    const nodeNumber = existingNodesOfType.length + 1;
    const nodeLabel = nodeNumber > 1 ? `${template.label} ${nodeNumber}` : template.label;

    const newNode = {
      id: `${template.type}-${Date.now()}`,
      type: template.type,
      position,
      data: {
        ...template.defaultData,
        label: nodeLabel,
      },
    };

    addNode(newNode);
  }, [addNode, screenToFlowPosition]);

  return (
    <div className="w-80 bg-zinc-900/95 border-r border-zinc-800 flex flex-col backdrop-blur-xs h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-semibold text-white mb-3">Nodes</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-sm"
          />
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {Object.entries(groupedTemplates).map(([categoryKey, templates]) => {
            const category = nodeCategories[categoryKey];
            const isOpen = openCategories.has(categoryKey);

            return (
              <div key={categoryKey}>
                <button
                  onClick={() => toggleCategory(categoryKey)}
                  className="flex items-center justify-between w-full p-2 hover:bg-zinc-800/50 rounded-md transition-colors"
                >
                  <span className="text-sm font-medium text-zinc-400">{category.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zinc-600">{templates.length}</span>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                    )}
                  </div>
                </button>
                {isOpen && (
                  <div className="mt-1 space-y-1">
                    {templates.map((template) => (
                      <button
                        key={template.type}
                        onClick={() => handleAddNode(template)}
                        className="w-full flex items-start gap-3 p-3 hover:bg-zinc-800/70 rounded-md text-left group transition-colors"
                      >
                        <div className="text-xl group-hover:scale-110 transition-transform text-zinc-300">
                          {template.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white group-hover:text-white">
                            {template.label}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                            {template.type}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-600">
          <div className="flex items-center justify-between mb-1">
            <span>Total Nodes:</span>
            <span className="text-zinc-400">{nodeTemplates.length}</span>
          </div>
          <div className="text-[10px] mt-2 text-zinc-700">
            Click a node to add it to the canvas
          </div>
        </div>
      </div>
    </div>
  );
};


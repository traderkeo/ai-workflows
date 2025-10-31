import { useState } from 'react';
import { NODE_TEMPLATES, NodeTemplate, WorkflowNodeType } from '@/lib/workflow/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NodePaletteProps {
  onAddNode: (nodeType: WorkflowNodeType, config: Partial<any>) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(['Triggers', 'Actions', 'Logic', 'Transform'])
  );

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const filteredTemplates = NODE_TEMPLATES.filter(
    (template) =>
      template.label.toLowerCase().includes(search.toLowerCase()) ||
      template.description.toLowerCase().includes(search.toLowerCase())
  );

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, NodeTemplate[]>);

  const handleAddNode = (template: NodeTemplate) => {
    onAddNode(template.type, {
      label: template.label,
      description: template.description,
      icon: template.icon,
      config: template.defaultConfig,
    });
  };

  return (
    <div className="w-80 bg-zinc-900/95 border-r border-zinc-800 flex flex-col backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-semibold text-white mb-3">Nodes</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-zinc-700"
          />
        </div>
      </div>

      {/* Node List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {Object.entries(groupedTemplates).map(([category, templates]) => (
            <Collapsible
              key={category}
              open={openCategories.has(category)}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-zinc-800/50 rounded-md transition-colors">
                <span className="text-sm font-medium text-zinc-400">{category}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-600">{templates.length}</span>
                  {openCategories.has(category) ? (
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-500" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1">
                {templates.map((template) => (
                  <Button
                    key={template.label}
                    onClick={() => handleAddNode(template)}
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto hover:bg-zinc-800/70 text-left group"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <span className="text-2xl group-hover:scale-110 transition-transform">
                        {template.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white group-hover:text-white">
                          {template.label}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                          {template.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-600">
          <div className="flex items-center justify-between mb-1">
            <span>Total Nodes:</span>
            <span className="text-zinc-400">{NODE_TEMPLATES.length}</span>
          </div>
          <div className="text-[10px] mt-2 text-zinc-700">
            Click a node to add it to the canvas
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { Node as ReactFlowNode } from '@xyflow/react';
import { WorkflowNodeData, NODE_TEMPLATES, ConfigField } from '@/lib/workflow/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { X, Trash2, Settings } from 'lucide-react';

interface NodeConfigPanelProps {
  node: ReactFlowNode<WorkflowNodeData> | null;
  onUpdate: (updates: Partial<WorkflowNodeData>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function NodeConfigPanel({ node, onUpdate, onDelete, onClose }: NodeConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<Record<string, any>>({});
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (node) {
      setLocalConfig(node.data.config || {});
      setLabel(node.data.label);
      setDescription(node.data.description || '');
    }
  }, [node]);

  if (!node) {
    return (
      <div className="w-96 bg-zinc-900/95 border-l border-zinc-800 backdrop-blur-xs flex items-center justify-center">
        <div className="text-center p-8">
          <Settings className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Select a node to configure</p>
        </div>
      </div>
    );
  }

  const template = NODE_TEMPLATES.find(
    (t) => t.type === node.data.nodeType && t.label === node.data.label
  );

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onUpdate({ config: newConfig });
  };

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    onUpdate({ label: newLabel });
  };

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    onUpdate({ description: newDescription });
  };

  const renderConfigField = (field: ConfigField) => {
    const value = localConfig[field.key] ?? field.default ?? '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleConfigChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleConfigChange(field.key, parseFloat(e.target.value))}
            placeholder={field.placeholder}
            className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600"
          />
        );

      case 'textarea':
      case 'code':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleConfigChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={field.type === 'code' ? 6 : 3}
            className={`bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 resize-none ${
              field.type === 'code' ? 'font-mono text-xs' : ''
            }`}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleConfigChange(field.key, val)}>
            <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-white">
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              {field.options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-white focus:bg-zinc-800 focus:text-white"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleConfigChange(field.key, e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-950/50 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-zinc-400">{field.label}</span>
          </div>
        );

      default:
        return null;
    }
  };

  const getNodeColor = (nodeType: string) => {
    switch (nodeType) {
      case 'trigger':
        return 'text-green-400 border-green-500/30 bg-green-950/20';
      case 'action':
        return 'text-blue-400 border-blue-500/30 bg-blue-950/20';
      case 'logic':
        return 'text-purple-400 border-purple-500/30 bg-purple-950/20';
      case 'transform':
        return 'text-orange-400 border-orange-500/30 bg-orange-950/20';
      default:
        return 'text-zinc-400 border-zinc-500/30 bg-zinc-950/20';
    }
  };

  return (
    <div className="w-96 bg-zinc-900/95 border-l border-zinc-800 backdrop-blur-xs flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{node.data.icon}</span>
          <div>
            <Badge className={`${getNodeColor(node.data.nodeType)} text-[10px] font-mono mb-1`}>
              {node.data.nodeType.toUpperCase()}
            </Badge>
            <h3 className="text-sm font-medium text-zinc-400">Node Configuration</h3>
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-zinc-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                Node Name
              </label>
              <Input
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                rows={2}
                className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 resize-none"
                placeholder="Optional description..."
              />
            </div>
          </div>

          {/* Node-specific Configuration */}
          {template?.configSchema && template.configSchema.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-medium text-zinc-400 mb-3 pb-2 border-b border-zinc-800">
                Configuration
              </div>
              {template.configSchema.map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  {renderConfigField(field)}
                </div>
              ))}
            </div>
          )}

          {/* Node Info */}
          <div className="space-y-2 pt-4 border-t border-zinc-800">
            <div className="text-xs text-zinc-600">
              <div className="flex justify-between mb-1">
                <span>Node ID:</span>
                <span className="font-mono text-zinc-500">{node.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-mono text-zinc-500">{node.data.nodeType}</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t border-zinc-800 space-y-2">
        <Button
          onClick={onDelete}
          variant="destructive"
          className="w-full"
          size="sm"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Node
        </Button>
      </div>
    </div>
  );
}

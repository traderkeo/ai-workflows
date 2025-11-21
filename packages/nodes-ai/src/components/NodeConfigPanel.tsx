import React, { useState, useEffect } from 'react';
import { useFlowStore } from '../hooks/useFlowStore';
import type { AINode, AINodeData } from '../types';
import { X, Trash2, Settings } from 'lucide-react';
import { ModelSelectorDropdown } from './ModelSelectorDropdown';

export const NodeConfigPanel: React.FC = () => {
  const nodes = useFlowStore((s) => s.nodes);
  const selectedNodeIds = useFlowStore((s) => s.selectedNodeIds);
  const updateNode = useFlowStore((s) => s.updateNode);
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const setSelectedNodeIds = useFlowStore((s) => s.setSelectedNodeIds);

  const selectedNode = selectedNodeIds.length === 1 
    ? nodes.find((n) => n.id === selectedNodeIds[0])
    : null;

  const [localData, setLocalData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      setLocalData({ ...selectedNode.data });
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-96 bg-zinc-900/95 border-l border-zinc-800 backdrop-blur-xs flex items-center justify-center h-full">
        <div className="text-center p-8">
          <Settings className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Select a node to configure</p>
        </div>
      </div>
    );
  }

  const handleFieldChange = (field: string, value: any) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    updateNode(selectedNode.id, { [field]: value });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this node?')) {
      deleteNode(selectedNode.id);
      setSelectedNodeIds([]);
    }
  };

  const handleClose = () => {
    setSelectedNodeIds([]);
  };

  const getNodeTypeColor = (type: string) => {
    if (type === 'start' || type === 'stop') return 'text-green-400 border-green-500/30 bg-green-950/20';
    if (type.includes('agent') || type.includes('generate')) return 'text-blue-400 border-blue-500/30 bg-blue-950/20';
    if (type.includes('condition') || type.includes('loop')) return 'text-purple-400 border-purple-500/30 bg-purple-950/20';
    if (type.includes('transform') || type.includes('template')) return 'text-orange-400 border-orange-500/30 bg-orange-950/20';
    return 'text-zinc-400 border-zinc-500/30 bg-zinc-950/20';
  };

  const renderField = (key: string, value: any, label?: string) => {
    const fieldLabel = label || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    const fieldType = typeof value;

    // Skip internal fields
    if (['status', 'error', 'executionTime', 'isCollapsed', 'result', 'usage'].includes(key)) {
      return null;
    }

    // Handle different field types
    if (fieldType === 'boolean') {
      return (
        <div key={key} className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 block">
            {fieldLabel}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(key, e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-950/50 text-green-500 focus:ring-green-500"
            />
            <span className="text-sm text-zinc-300">{value ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
      );
    }

    if (fieldType === 'number') {
      return (
        <div key={key} className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 block">
            {fieldLabel}
          </label>
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => handleFieldChange(key, e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-full px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-sm"
            step={key.includes('temperature') || key.includes('speed') ? '0.1' : '1'}
          />
        </div>
      );
    }

    // Special handling for model field - use ModelSelectorDropdown
    if (key === 'model') {
      // Determine mode based on node type
      let mode: 'text' | 'structured' | 'image' | 'audio' | 'speech' | undefined;
      if (selectedNode.type === 'generate') {
        mode = localData.mode === 'structured' ? 'structured' : 'text';
      } else if (selectedNode.type === 'ai-agent') {
        const agentMode = localData.mode;
        if (agentMode === 'image' || agentMode === 'image-edit' || agentMode === 'image-variation') {
          mode = 'image';
        } else if (agentMode === 'audio' || agentMode === 'speech') {
          mode = agentMode === 'speech' ? 'speech' : 'audio';
        } else {
          mode = agentMode === 'structured' ? 'structured' : 'text';
        }
      } else if (selectedNode.type === 'image-generation') {
        mode = 'image';
      } else if (selectedNode.type === 'audio-tts') {
        mode = 'audio';
      }

      return (
        <div key={key} className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 block">
            {fieldLabel}
          </label>
          <ModelSelectorDropdown
            value={value || ''}
            mode={mode}
            onChange={(modelId) => handleFieldChange(key, modelId)}
            allowCustomId={true}
          />
        </div>
      );
    }

    // Handle string fields - check if it's a long text (textarea)
    if (fieldType === 'string') {
      const isLongText = key.includes('prompt') || key.includes('template') || key.includes('code') || 
                        key.includes('instructions') || key.includes('text') || key.includes('query') ||
                        key.includes('url') || key.includes('body') || value?.length > 50;
      
      if (isLongText) {
        return (
          <div key={key} className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 block">
              {fieldLabel}
            </label>
            <textarea
              value={value || ''}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              rows={key.includes('template') || key.includes('code') ? 6 : 3}
              className="w-full px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-700 text-sm font-mono"
              placeholder={`Enter ${fieldLabel.toLowerCase()}...`}
            />
          </div>
        );
      }

      return (
        <div key={key} className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 block">
            {fieldLabel}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className="w-full px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-sm"
            placeholder={`Enter ${fieldLabel.toLowerCase()}...`}
          />
        </div>
      );
    }

    // Handle select fields (enums) - organized by node type and field
    const renderSelect = (options: Array<{ value: string; label: string }>, defaultValue?: string) => (
      <div key={key} className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400 block">
          {fieldLabel}
        </label>
        <select
          value={value || defaultValue || ''}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          className="w-full px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-zinc-700 text-sm"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );

    // Generate node
    if (key === 'mode' && selectedNode.type === 'generate') {
      return renderSelect([
        { value: 'text', label: 'Text' },
        { value: 'structured', label: 'Structured' },
      ], 'text');
    }

    // Start node
    if (key === 'valueType' && selectedNode.type === 'start') {
      return renderSelect([
        { value: 'string', label: 'Text' },
        { value: 'number', label: 'Number' },
        { value: 'object', label: 'JSON Object' },
        { value: 'array', label: 'Array' },
      ], 'string');
    }

    // HTTP Request node
    if (key === 'method' && selectedNode.type === 'http-request') {
      return renderSelect([
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
        { value: 'PATCH', label: 'PATCH' },
      ], 'GET');
    }

    // Voice (Audio TTS / AI Agent)
    if (key === 'voice' && (selectedNode.type === 'audio-tts' || selectedNode.type === 'ai-agent')) {
      return renderSelect([
        { value: 'alloy', label: 'Alloy' },
        { value: 'echo', label: 'Echo' },
        { value: 'fable', label: 'Fable' },
        { value: 'onyx', label: 'Onyx' },
        { value: 'nova', label: 'Nova' },
        { value: 'shimmer', label: 'Shimmer' },
      ], 'alloy');
    }

    // Condition node
    if (key === 'conditionType' && selectedNode.type === 'condition') {
      return renderSelect([
        { value: 'length', label: 'Length' },
        { value: 'contains', label: 'Contains' },
        { value: 'regex', label: 'Regex' },
        { value: 'numeric', label: 'Numeric' },
        { value: 'custom', label: 'Custom' },
      ], 'length');
    }

    if (key === 'numericOperator' && selectedNode.type === 'condition') {
      return renderSelect([
        { value: '>', label: 'Greater Than (>)' },
        { value: '>=', label: 'Greater Than or Equal (>=)' },
        { value: '<', label: 'Less Than (<)' },
        { value: '<=', label: 'Less Than or Equal (<=)' },
        { value: '==', label: 'Equal (==)' },
        { value: '!=', label: 'Not Equal (!=)' },
      ], '>');
    }

    // Loop node
    if (key === 'loopType' && selectedNode.type === 'loop') {
      return renderSelect([
        { value: 'count', label: 'Fixed Count' },
        { value: 'array', label: 'Iterate Array' },
        { value: 'condition', label: 'Conditional' },
      ], 'count');
    }

    // Merge node
    if (key === 'mergeStrategy' && selectedNode.type === 'merge') {
      return renderSelect([
        { value: 'object', label: 'Object (Key-Value Pairs)' },
        { value: 'array', label: 'Array (List)' },
        { value: 'concat', label: 'Concat (Join Text)' },
      ], 'object');
    }

    // Splitter node
    if (key === 'strategy' && selectedNode.type === 'splitter') {
      return renderSelect([
        { value: 'length', label: 'Length' },
        { value: 'lines', label: 'Lines' },
        { value: 'sentences', label: 'Sentences' },
        { value: 'regex', label: 'Regex' },
      ], 'length');
    }

    // Aggregator node
    if (key === 'mode' && selectedNode.type === 'aggregator') {
      return renderSelect([
        { value: 'concat-text', label: 'Concat Text' },
        { value: 'merge-objects', label: 'Merge Objects' },
        { value: 'flatten-array', label: 'Flatten Array' },
      ], 'concat-text');
    }

    // Cache node
    if (key === 'operation' && selectedNode.type === 'cache') {
      return renderSelect([
        { value: 'get', label: 'Get' },
        { value: 'set', label: 'Set' },
      ], 'get');
    }

    // Document Ingest node
    if (key === 'sourceType' && selectedNode.type === 'document-ingest') {
      return renderSelect([
        { value: 'text', label: 'Text' },
        { value: 'url', label: 'URL' },
      ], 'text');
    }

    // AI Agent node - mode
    if (key === 'mode' && selectedNode.type === 'ai-agent') {
      return renderSelect([
        { value: 'text', label: 'Text' },
        { value: 'structured', label: 'Structured' },
        { value: 'image', label: 'Image' },
        { value: 'image-edit', label: 'Image Edit' },
        { value: 'image-variation', label: 'Image Variation' },
        { value: 'audio', label: 'Audio' },
        { value: 'speech', label: 'Speech' },
      ], 'text');
    }

    // Image operation (AI Agent / Image Generation)
    if (key === 'imageOperation' && (selectedNode.type === 'ai-agent' || selectedNode.type === 'image-generation')) {
      return renderSelect([
        { value: 'generate', label: 'Generate' },
        { value: 'edit', label: 'Edit' },
        { value: 'variation', label: 'Variation' },
      ], 'generate');
    }

    if (key === 'operation' && selectedNode.type === 'image-generation') {
      return renderSelect([
        { value: 'generate', label: 'Generate' },
        { value: 'edit', label: 'Edit' },
        { value: 'variation', label: 'Variation' },
      ], 'generate');
    }

    // Image size
    if (key === 'imageSize' && (selectedNode.type === 'ai-agent' || selectedNode.type === 'image-generation')) {
      return renderSelect([
        { value: '256x256', label: '256x256' },
        { value: '512x512', label: '512x512' },
        { value: '1024x1024', label: '1024x1024' },
        { value: '1536x1024', label: '1536x1024' },
        { value: '1024x1536', label: '1024x1536' },
        { value: '1792x1024', label: '1792x1024' },
        { value: 'auto', label: 'Auto' },
      ], '1024x1024');
    }

    if (key === 'size' && selectedNode.type === 'image-generation') {
      return renderSelect([
        { value: '256x256', label: '256x256' },
        { value: '512x512', label: '512x512' },
        { value: '1024x1024', label: '1024x1024' },
        { value: '1536x1024', label: '1536x1024' },
        { value: '1024x1536', label: '1024x1536' },
        { value: '1792x1024', label: '1792x1024' },
        { value: 'auto', label: 'Auto' },
      ], '1024x1024');
    }

    // Image quality
    if (key === 'imageQuality' && (selectedNode.type === 'ai-agent' || selectedNode.type === 'image-generation')) {
      return renderSelect([
        { value: 'standard', label: 'Standard' },
        { value: 'hd', label: 'HD' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
        { value: 'auto', label: 'Auto' },
      ], 'standard');
    }

    if (key === 'quality' && selectedNode.type === 'image-generation') {
      return renderSelect([
        { value: 'standard', label: 'Standard' },
        { value: 'hd', label: 'HD' },
      ], 'standard');
    }

    // Image style
    if (key === 'imageStyle' && (selectedNode.type === 'ai-agent' || selectedNode.type === 'image-generation')) {
      return renderSelect([
        { value: 'natural', label: 'Natural' },
        { value: 'vivid', label: 'Vivid' },
      ], 'natural');
    }

    if (key === 'style' && selectedNode.type === 'image-generation') {
      return renderSelect([
        { value: 'natural', label: 'Natural' },
        { value: 'vivid', label: 'Vivid' },
      ], 'natural');
    }

    // Image response format
    if (key === 'imageResponseFormat' && selectedNode.type === 'ai-agent') {
      return renderSelect([
        { value: 'url', label: 'URL' },
        { value: 'b64_json', label: 'Base64 JSON' },
      ], 'url');
    }

    if (key === 'responseFormat' && selectedNode.type === 'image-generation') {
      return renderSelect([
        { value: 'url', label: 'URL' },
        { value: 'b64_json', label: 'Base64 JSON' },
      ], 'url');
    }

    // Image background
    if (key === 'imageBackground' && selectedNode.type === 'ai-agent') {
      return renderSelect([
        { value: 'transparent', label: 'Transparent' },
        { value: 'opaque', label: 'Opaque' },
        { value: 'auto', label: 'Auto' },
      ], 'auto');
    }

    // Image moderation
    if (key === 'imageModeration' && selectedNode.type === 'ai-agent') {
      return renderSelect([
        { value: 'low', label: 'Low' },
        { value: 'auto', label: 'Auto' },
      ], 'auto');
    }

    // Image output format
    if (key === 'imageOutputFormat' && selectedNode.type === 'ai-agent') {
      return renderSelect([
        { value: 'png', label: 'PNG' },
        { value: 'jpeg', label: 'JPEG' },
        { value: 'webp', label: 'WebP' },
      ], 'png');
    }

    // Image edit fidelity
    if (key === 'imageEditFidelity' && selectedNode.type === 'ai-agent') {
      return renderSelect([
        { value: 'high', label: 'High' },
        { value: 'low', label: 'Low' },
      ], 'high');
    }

    // Special handling for value field in Start node
    if (key === 'value' && selectedNode.type === 'start') {
      const valueType = localData.valueType || 'string';
      const displayValue = typeof value === 'object' 
        ? JSON.stringify(value, null, 2) 
        : String(value || '');
      
      return (
        <div key={key} className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 block">
            {fieldLabel}
          </label>
          {valueType === 'object' || valueType === 'array' ? (
            <textarea
              value={displayValue}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleFieldChange(key, parsed);
                } catch {
                  // Keep as string if invalid JSON
                  handleFieldChange(key, e.target.value);
                }
              }}
              rows={6}
              className="w-full px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-700 text-xs font-mono"
              placeholder="Enter JSON..."
            />
          ) : (
            <input
              type={valueType === 'number' ? 'number' : 'text'}
              value={displayValue}
              onChange={(e) => {
                if (valueType === 'number') {
                  handleFieldChange(key, e.target.value ? parseFloat(e.target.value) : undefined);
                } else {
                  handleFieldChange(key, e.target.value);
                }
              }}
              className="w-full px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-sm"
              placeholder={`Enter ${valueType}...`}
            />
          )}
        </div>
      );
    }

    // Handle schemaFields array (for structured mode)
    if (key === 'schemaFields' && Array.isArray(value)) {
      return (
        <div key={key} className="space-y-2">
          <label className="text-xs font-medium text-zinc-400 block">
            {fieldLabel}
          </label>
          <div className="space-y-2">
            {value.map((field: any, index: number) => (
              <div key={index} className="p-2 bg-zinc-950/50 border border-zinc-800 rounded-md space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={field.name || ''}
                    onChange={(e) => {
                      const newFields = [...value];
                      newFields[index] = { ...field, name: e.target.value };
                      handleFieldChange(key, newFields);
                    }}
                    placeholder="Field name"
                    className="px-2 py-1 bg-zinc-900/50 border border-zinc-700 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-zinc-600"
                  />
                  <select
                    value={field.type || 'string'}
                    onChange={(e) => {
                      const newFields = [...value];
                      newFields[index] = { ...field, type: e.target.value };
                      handleFieldChange(key, newFields);
                    }}
                    className="px-2 py-1 bg-zinc-900/50 border border-zinc-700 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-zinc-600"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="object">Object</option>
                    <option value="array">Array</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={field.description || ''}
                  onChange={(e) => {
                    const newFields = [...value];
                    newFields[index] = { ...field, description: e.target.value };
                    handleFieldChange(key, newFields);
                  }}
                  placeholder="Description (optional)"
                  className="w-full px-2 py-1 bg-zinc-900/50 border border-zinc-700 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-zinc-600"
                />
                <button
                  onClick={() => {
                    const newFields = value.filter((_: any, i: number) => i !== index);
                    handleFieldChange(key, newFields);
                  }}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                handleFieldChange(key, [...value, { name: '', type: 'string', description: '' }]);
              }}
              className="w-full px-2 py-1 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded hover:border-zinc-600 transition-colors"
            >
              + Add Field
            </button>
          </div>
        </div>
      );
    }

    // Handle objects/arrays - show as JSON editor
    if (fieldType === 'object' || Array.isArray(value)) {
      return (
        <div key={key} className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 block">
            {fieldLabel}
          </label>
          <textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleFieldChange(key, parsed);
              } catch {
                // Invalid JSON, keep as string for now
              }
            }}
            rows={4}
            className="w-full px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-700 text-xs font-mono"
            placeholder="Enter JSON..."
          />
        </div>
      );
    }

    // Default: show as read-only
    return (
      <div key={key} className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400 block">
          {fieldLabel}
        </label>
        <div className="text-xs text-zinc-500 font-mono bg-zinc-950/50 border border-zinc-800 rounded px-2 py-1.5 break-all">
          {String(value ?? '')}
        </div>
      </div>
    );
  };

  // Helper to check if a field should be shown based on conditional logic
  const shouldShowField = (key: string, value: any): boolean => {
    // Condition node - show fields based on conditionType
    if (selectedNode.type === 'condition') {
      const conditionType = localData.conditionType || 'length';
      if (key === 'minLength' || key === 'maxLength') return conditionType === 'length';
      if (key === 'containsText' || key === 'caseSensitive') return conditionType === 'contains';
      if (key === 'regexPattern' || key === 'regexFlags') return conditionType === 'regex';
      if (key === 'numericOperator' || key === 'numericValue') return conditionType === 'numeric';
      if (key === 'conditionCode') return conditionType === 'custom';
    }

    // Loop node - show fields based on loopType
    if (selectedNode.type === 'loop') {
      const loopType = localData.loopType || 'count';
      if (key === 'count') return loopType === 'count';
      if (key === 'conditionCode') return loopType === 'condition';
      // loopType === 'array' doesn't need extra fields
    }

    // Splitter node - show fields based on strategy
    if (selectedNode.type === 'splitter') {
      const strategy = localData.strategy || 'length';
      if (key === 'chunkSize' || key === 'overlap') return strategy === 'length';
      if (key === 'regexPattern' || key === 'regexFlags') return strategy === 'regex';
    }

    // Aggregator node - show delimiter only for concat-text mode
    if (selectedNode.type === 'aggregator') {
      const mode = localData.mode || 'concat-text';
      if (key === 'delimiter') return mode === 'concat-text';
    }

    // Always show other fields
    return true;
  };

  // Get all editable fields (exclude internal ones)
  const editableFields = Object.entries(localData)
    .filter(([key]) => !['status', 'error', 'executionTime', 'isCollapsed', 'result', 'usage', 'currentIteration', 'results'].includes(key))
    .filter(([key, value]) => shouldShowField(key, value))
    .sort(([a], [b]) => {
      // Prioritize common fields
      const priority = ['label', 'name', 'description', 'prompt', 'model', 'temperature', 'maxTokens', 'conditionType', 'loopType', 'mergeStrategy', 'strategy', 'mode'];
      const aIdx = priority.indexOf(a);
      const bIdx = priority.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });

  return (
    <div className="w-96 bg-zinc-900/95 border-l border-zinc-800 backdrop-blur-xs flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="text-3xl text-zinc-300">{selectedNode.type || 'unknown'}</div>
          <div>
            <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono mb-1 border ${getNodeTypeColor(selectedNode.type || 'unknown')}`}>
              {(selectedNode.type || 'unknown').toUpperCase()}
            </div>
            <h3 className="text-sm font-medium text-zinc-400">Node Configuration</h3>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Render all editable fields */}
          {editableFields.map(([key, value]) => renderField(key, value))}

          {/* Node Info */}
          <div className="space-y-2 pt-4 border-t border-zinc-800">
            <div className="text-xs text-zinc-600">
              <div className="flex justify-between mb-1">
                <span>Node ID:</span>
                <span className="font-mono text-zinc-500">{selectedNode.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-mono text-zinc-500">{selectedNode.type}</span>
              </div>
              {localData.status && (
                <div className="flex justify-between mt-1">
                  <span>Status:</span>
                  <span className="font-mono text-zinc-500">{localData.status}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-zinc-800 space-y-2">
        <button
          onClick={handleDelete}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Node
        </button>
      </div>
    </div>
  );
};

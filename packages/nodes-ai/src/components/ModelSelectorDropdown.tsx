import React, { useMemo, useState, useRef, useEffect } from 'react';
import { MODEL_CONFIGS, getModelsByMode, type GenerationMode } from '../config/modelCapabilities';
import { ChevronDown, Check, MessageSquare } from 'lucide-react';

interface ModelSelectorDropdownProps {
  value?: string;
  mode?: GenerationMode;
  onChange: (modelId: string) => void;
  allowCustomId?: boolean;
  className?: string;
}

export const ModelSelectorDropdown: React.FC<ModelSelectorDropdownProps> = ({
  value,
  mode,
  onChange,
  allowCustomId = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const all = useMemo(() => {
    const arr = mode ? getModelsByMode(mode) : Object.values(MODEL_CONFIGS);
    return arr.filter((m) => !m.disabled);
  }, [mode]);

  const filteredModels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter((m) =>
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      (m.description || '').toLowerCase().includes(q)
    );
  }, [all, searchQuery]);

  const selectedModel = value ? MODEL_CONFIGS[value] : undefined;
  const displayValue = selectedModel ? selectedModel.name : value || 'Select a model';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (modelId: string) => {
    onChange(modelId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-md text-white hover:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MessageSquare className="h-4 w-4 text-zinc-400 flex-shrink-0" />
          <span className="text-sm font-medium truncate">{displayValue}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-zinc-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg max-h-80 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-zinc-800">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models..."
              className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-sm"
              autoFocus
            />
          </div>

          {/* Models List */}
          <div className="overflow-y-auto flex-1">
            {filteredModels.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">
                No models match "{searchQuery}"
              </div>
            ) : (
              <div className="p-2">
                {filteredModels.map((model) => {
                  const isSelected = value === model.id;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => handleSelect(model.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${
                        isSelected
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{model.name}</span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                          {model.description && (
                            <div className="text-xs text-zinc-500 mt-0.5">
                              {model.description}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500 uppercase flex-shrink-0">
                          {model.provider}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Model Input */}
          {allowCustomId && (
            <div className="p-2 border-t border-zinc-800">
              <div className="text-xs text-zinc-500 mb-1.5">Or enter custom model ID:</div>
              <input
                type="text"
                value={value && !MODEL_CONFIGS[value] ? value : ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g. meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"
                className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-xs font-mono"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};


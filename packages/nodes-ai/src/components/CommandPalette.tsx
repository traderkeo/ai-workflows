import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useFlowStore } from '../hooks/useFlowStore';
import { useReactFlow } from '@xyflow/react';
import type { AINode } from '../types';
import { nodeTemplates } from './ContextMenu';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addNode } = useFlowStore();
  const { getViewport } = useReactFlow();

  // Filter node templates based on search
  const filteredNodes = useMemo(() => {
    if (!search.trim()) return nodeTemplates;
    const searchLower = search.toLowerCase();
    return nodeTemplates.filter(
      (template) =>
        template.label.toLowerCase().includes(searchLower) ||
        template.type.toLowerCase().includes(searchLower)
    );
  }, [search]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredNodes.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredNodes[selectedIndex]) {
          handleAddNode(filteredNodes[selectedIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredNodes, onClose]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      // Focus input after a brief delay to ensure modal is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleAddNode = (template: typeof nodeTemplates[0]) => {
    const viewport = getViewport();

    // Add node at center of viewport
    const x = (-viewport.x + window.innerWidth / 2) / viewport.zoom;
    const y = (-viewport.y + window.innerHeight / 2) / viewport.zoom;

    const newNode: AINode = {
      id: `${template.type}-${Date.now()}`,
      type: template.type,
      position: { x, y },
      data: template.defaultData,
    };

    addNode(newNode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <div className="bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search size={18} className="text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nodes... (type to filter)"
              className="flex-1 bg-transparent border-none outline-hidden text-sm text-foreground placeholder:text-muted-foreground"
              autoComplete="off"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-accent transition-colors"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredNodes.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No nodes found matching "{search}"
              </div>
            ) : (
              <div className="py-2">
                {filteredNodes.map((template, index) => (
                  <button
                    key={template.type}
                    onClick={() => handleAddNode(template)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="shrink-0 text-primary">{template.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {template.label}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {template.type}
                      </div>
                    </div>
                    {index === selectedIndex && (
                      <div className="text-xs text-muted-foreground font-mono">↵</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Hint */}
          <div className="px-4 py-2 border-t border-border bg-muted/30">
            <div className="text-[10px] text-muted-foreground font-mono flex items-center justify-between">
              <span>↑↓ navigate • ↵ select • esc close</span>
              <span>Ctrl+K to toggle</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

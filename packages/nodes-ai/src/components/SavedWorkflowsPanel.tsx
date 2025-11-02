import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Download, Plus, X, Clock, FileCode } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import type { SavedWorkflow } from '../types';

interface SavedWorkflowsPanelProps {
  onLoad: (workflow: SavedWorkflow) => void;
  onSave: () => SavedWorkflow;
  currentWorkflowId: string;
}

interface SavedWorkflowItem {
  id: string;
  name: string;
  updatedAt: number;
  workflow: SavedWorkflow;
}

const STORAGE_KEY = 'ai-workflows-library';

export const SavedWorkflowsPanel: React.FC<SavedWorkflowsPanelProps> = ({
  onLoad,
  onSave,
  currentWorkflowId,
}) => {
  const notifications = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflowItem[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Load saved workflows from localStorage
  useEffect(() => {
    loadSavedWorkflows();
  }, []);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen && !saveDialogOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (saveDialogOpen) {
          setSaveDialogOpen(false);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, saveDialogOpen]);

  const loadSavedWorkflows = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const workflows = JSON.parse(stored) as SavedWorkflowItem[];
        setSavedWorkflows(workflows.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    } catch (error) {
      console.error('Failed to load saved workflows:', error);
    }
  };

  const saveWorkflowToLibrary = async () => {
    if (!saveName.trim()) {
      await notifications.showAlert('Please enter a workflow name', 'Save Workflow');
      return;
    }

    try {
      const workflow = onSave();
      const item: SavedWorkflowItem = {
        id: workflow.metadata.id,
        name: saveName.trim(),
        updatedAt: Date.now(),
        workflow: {
          ...workflow,
          metadata: {
            ...workflow.metadata,
            name: saveName.trim(),
            updatedAt: Date.now(),
          },
        },
      };

      const existing = savedWorkflows.filter((w) => w.id !== item.id);
      const updated = [item, ...existing];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedWorkflows(updated);
      setSaveDialogOpen(false);
      setSaveName('');
      notifications.showToast('Workflow saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      notifications.showToast('Failed to save workflow', 'destructive');
    }
  };

  const loadWorkflowFromLibrary = async (item: SavedWorkflowItem) => {
    const confirmed = await notifications.showConfirm(
      `Load workflow "${item.name}"? Current workflow will be replaced.`,
      'Load Workflow'
    );
    if (confirmed) {
      onLoad(item.workflow);
      setIsOpen(false);
    }
  };

  const deleteWorkflowFromLibrary = async (id: string, name: string) => {
    const confirmed = await notifications.showConfirm(
      `Delete workflow "${name}"? This cannot be undone.`,
      'Delete Workflow'
    );
    if (confirmed) {
      const updated = savedWorkflows.filter((w) => w.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedWorkflows(updated);
    }
  };

  const exportWorkflow = (item: SavedWorkflowItem) => {
    const json = JSON.stringify(item.workflow, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-8 px-3 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
        title="Saved workflows"
      >
        <FolderOpen size={14} />
        <span className="hidden sm:inline">Saved</span>
        <span className="hidden xs:inline">({savedWorkflows.length})</span>
      </button>

      {/* Save Dialog */}
      {saveDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in-0">
          <div
            className="absolute inset-0"
            onClick={() => setSaveDialogOpen(false)}
          />
          <div
            className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4 animate-in zoom-in-95 fade-in-0 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Save Workflow</h3>
                <button
                  onClick={() => setSaveDialogOpen(false)}
                  className="rounded-sm opacity-70 hover:opacity-100 transition-opacity p-1 hover:bg-accent"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter workflow name..."
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveWorkflowToLibrary();
                    if (e.key === 'Escape') setSaveDialogOpen(false);
                  }}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setSaveDialogOpen(false)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={saveWorkflowToLibrary}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 bg-primary text-primary-foreground shadow hover:bg-primary/90"
                >
                  <Save size={14} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in-0"
          onClick={(e) => {
            // Close when clicking directly on the backdrop
            const target = e.target as HTMLElement;
            if (target.classList.contains('fixed') || target.id === 'backdrop-overlay') {
              setIsOpen(false);
            }
          }}
        >
          <div
            id="backdrop-overlay"
            className="absolute inset-0"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 fade-in-0 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Saved Workflows</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {savedWorkflows.length} saved workflow{savedWorkflows.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setSaveDialogOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-3 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Plus size={14} />
                  Save Current
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-sm opacity-70 hover:opacity-100 transition-opacity p-2 hover:bg-accent"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {savedWorkflows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderOpen size={48} className="text-muted-foreground mb-4 opacity-50" />
                  <p className="text-sm font-medium text-foreground mb-1">No saved workflows</p>
                  <p className="text-xs text-muted-foreground">
                    Click "Save Current" to save your first workflow
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedWorkflows.map((item) => (
                    <div
                      key={item.id}
                      className={`group relative p-4 rounded-lg border transition-all cursor-pointer ${
                        item.id === currentWorkflowId
                          ? 'bg-accent border-primary shadow-sm'
                          : 'bg-card border-border hover:border-primary/50 hover:bg-accent/50'
                      }`}
                      onClick={() => loadWorkflowFromLibrary(item)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FileCode size={16} className="text-muted-foreground flex-shrink-0" />
                            <h4 className="text-sm font-semibold text-foreground truncate">
                              {item.name}
                            </h4>
                            {item.id === currentWorkflowId && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary border border-primary/30">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono ml-6 mb-2">
                            <span>{item.workflow.flow.nodes.length} nodes</span>
                            <span className="text-border">•</span>
                            <span>{item.workflow.flow.edges.length} edges</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground ml-6">
                            <Clock size={12} />
                            <span>{formatDate(item.updatedAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              exportWorkflow(item);
                            }}
                            className="p-1.5 rounded-md hover:bg-accent transition-colors"
                            title="Export"
                          >
                            <Download size={14} className="text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWorkflowFromLibrary(item.id, item.name);
                            }}
                            className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} className="text-destructive" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Save, FolderOpen, Trash2, Download, Plus, X, Clock, FileCode, Search, Tag as TagIcon, Filter } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import type { SavedWorkflow } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Label } from './ui/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/Dialog';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Load saved workflows from localStorage
  useEffect(() => {
    loadSavedWorkflows();
  }, []);

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
      // Close dialog immediately to improve perceived performance
      setIsOpen(false);

      // Load the workflow
      onLoad(item.workflow);

      // Show success notification
      notifications.showToast(`Loaded workflow "${item.name}"`, 'success');
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

  // Get all unique tags from saved workflows
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    savedWorkflows.forEach(item => {
      item.workflow.metadata.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [savedWorkflows]);

  // Filter workflows based on search and tags
  const filteredWorkflows = useMemo(() => {
    return savedWorkflows.filter(item => {
      const matchesSearch = searchQuery.trim() === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => item.workflow.metadata.tags?.includes(tag));
      
      return matchesSearch && matchesTags;
    });
  }, [savedWorkflows, searchQuery, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => {
          if (!isOpen) {
            // Reset filters when opening
            setSearchQuery('');
            setSelectedTags([]);
          }
          setIsOpen(!isOpen);
        }}
        variant="outline"
        size="sm"
        style={{
          fontFamily: 'var(--font-primary)',
        }}
        title="Saved workflows"
      >
        <FolderOpen size={14} />
        <span>Saved</span>
        {savedWorkflows.length > 0 && <span>({savedWorkflows.length})</span>}
      </Button>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent
          style={{
            maxWidth: '500px',
            fontFamily: 'var(--font-primary)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-primary)' }}>
              Save Workflow
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'var(--font-mono)' }}>
              Enter a name for your workflow
            </DialogDescription>
          </DialogHeader>
          <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            <Label
              htmlFor="workflow-name"
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--cyber-neon-purple)',
                marginBottom: '8px',
                fontFamily: 'var(--font-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Workflow Name
            </Label>
            <Input
              id="workflow-name"
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter workflow name..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveWorkflowToLibrary();
                if (e.key === 'Escape') setSaveDialogOpen(false);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
              }}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setSaveDialogOpen(false)}
              variant="outline"
              size="sm"
              style={{
                fontFamily: 'var(--font-primary)',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveWorkflowToLibrary}
              variant="default"
              size="sm"
              style={{
                fontFamily: 'var(--font-primary)',
              }}
            >
              <Save size={14} />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Panel */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          style={{
            maxWidth: '900px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--font-primary)',
            padding: 0,
          }}
        >
          <DialogHeader
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(176, 38, 255, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <DialogTitle
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--cyber-neon-cyan)',
                    fontFamily: 'var(--font-primary)',
                    letterSpacing: '0.01em',
                    textShadow: '0 0 5px currentColor',
                    marginBottom: '4px',
                  }}
                >
                  Saved Workflows
                </DialogTitle>
                <DialogDescription
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted, #888)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {filteredWorkflows.length} of {savedWorkflows.length} workflow{savedWorkflows.length !== 1 ? 's' : ''}
                </DialogDescription>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    setSaveDialogOpen(true);
                  }}
                  variant="default"
                  size="sm"
                  style={{
                    fontFamily: 'var(--font-primary)',
                  }}
                >
                  <Plus size={14} />
                  Save Current
                </Button>
              </div>
            </div>
          </DialogHeader>

            {/* Search and Filters */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(176, 38, 255, 0.3)' }}>
              {/* Search */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted, #888)',
                    }}
                  />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search workflows..."
                    style={{
                      width: '100%',
                      paddingLeft: '36px',
                      paddingRight: '12px',
                      paddingTop: '8px',
                      paddingBottom: '8px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid var(--cyber-neon-purple)',
                      borderRadius: '4px',
                      color: 'var(--cyber-neon-cyan)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Tag Filters */}
              {allTags.length > 0 && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <Filter size={14} style={{ color: 'var(--text-muted, #888)' }} />
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--cyber-neon-purple)',
                        fontFamily: 'var(--font-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: 500,
                      }}
                    >
                      Filter by Tags:
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                    }}
                  >
                    {allTags.map((tag) => (
                      <Button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        size="sm"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          background: selectedTags.includes(tag)
                            ? 'rgba(0, 240, 255, 0.2)'
                            : 'rgba(176, 38, 255, 0.1)',
                          border: selectedTags.includes(tag)
                            ? '1px solid var(--cyber-neon-cyan)'
                            : '1px solid rgba(176, 38, 255, 0.3)',
                          borderRadius: '4px',
                          color: selectedTags.includes(tag)
                            ? 'var(--cyber-neon-cyan)'
                            : 'var(--cyber-neon-purple)',
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedTags.includes(tag)) {
                            e.currentTarget.style.background = 'rgba(176, 38, 255, 0.2)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedTags.includes(tag)) {
                            e.currentTarget.style.background = 'rgba(176, 38, 255, 0.1)';
                          }
                        }}
                      >
                        <TagIcon size={10} />
                        {tag}
                      </Button>
                    ))}
                    {selectedTags.length > 0 && (
                      <Button
                        onClick={() => setSelectedTags([])}
                        variant="outline"
                        size="sm"
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(255, 0, 64, 0.1)',
                          border: '1px solid rgba(255, 0, 64, 0.3)',
                          borderRadius: '4px',
                          color: '#ff0040',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 0, 64, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 0, 64, 0.1)';
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
              }}
            >
              {savedWorkflows.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 20px',
                    textAlign: 'center',
                  }}
                >
                  <FolderOpen
                    size={48}
                    style={{
                      color: 'var(--text-muted, #888)',
                      marginBottom: '16px',
                      opacity: 0.5,
                    }}
                  />
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--cyber-neon-cyan)',
                      marginBottom: '4px',
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    No saved workflows
                  </p>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted, #888)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Click "Save Current" to save your first workflow
                  </p>
                </div>
              ) : filteredWorkflows.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 20px',
                    textAlign: 'center',
                  }}
                >
                  <Search
                    size={48}
                    style={{
                      color: 'var(--text-muted, #888)',
                      marginBottom: '16px',
                      opacity: 0.5,
                    }}
                  />
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--cyber-neon-cyan)',
                      marginBottom: '4px',
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    No workflows match your filters
                  </p>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted, #888)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Try adjusting your search or tag filters
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredWorkflows.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadWorkflowFromLibrary(item)}
                      style={{
                        position: 'relative',
                        padding: '16px',
                        borderRadius: '6px',
                        border: item.id === currentWorkflowId
                          ? '1px solid var(--cyber-neon-cyan)'
                          : '1px solid rgba(176, 38, 255, 0.3)',
                        background: item.id === currentWorkflowId
                          ? 'rgba(0, 240, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (item.id !== currentWorkflowId) {
                          e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.6)';
                          e.currentTarget.style.background = 'rgba(176, 38, 255, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (item.id !== currentWorkflowId) {
                          e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.3)';
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <FileCode
                              size={16}
                              style={{
                                color: 'var(--cyber-neon-cyan)',
                                flexShrink: 0,
                              }}
                            />
                            <h4
                              style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: 'var(--cyber-neon-cyan)',
                                fontFamily: 'var(--font-primary)',
                                letterSpacing: '0.01em',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.name}
                            </h4>
                            {item.id === currentWorkflowId && (
                              <Badge
                                variant="secondary"
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  background: 'rgba(0, 240, 255, 0.2)',
                                  color: 'var(--cyber-neon-cyan)',
                                  border: '1px solid var(--cyber-neon-cyan)',
                                }}
                              >
                                CURRENT
                              </Badge>
                            )}
                          </div>

                          {/* Tags */}
                          {item.workflow.metadata.tags && item.workflow.metadata.tags.length > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '4px',
                                marginBottom: '8px',
                                marginLeft: '24px',
                              }}
                            >
                              {item.workflow.metadata.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  style={{
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    fontFamily: 'var(--font-mono)',
                                    background: 'rgba(176, 38, 255, 0.15)',
                                    color: 'var(--cyber-neon-purple)',
                                    border: '1px solid rgba(176, 38, 255, 0.3)',
                                  }}
                                >
                                  <TagIcon size={8} />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '11px',
                              color: 'var(--text-muted, #888)',
                              fontFamily: 'var(--font-mono)',
                              marginLeft: '24px',
                              marginBottom: '4px',
                            }}
                          >
                            <span>{item.workflow.flow.nodes.length} nodes</span>
                            <span>•</span>
                            <span>{item.workflow.flow.edges.length} edges</span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '10px',
                              color: 'var(--text-muted, #888)',
                              fontFamily: 'var(--font-mono)',
                              marginLeft: '24px',
                            }}
                          >
                            <Clock size={12} />
                            <span>{formatDate(item.updatedAt)}</span>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                          }}
                          className="group-hover:opacity-100"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '0';
                          }}
                        >
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              exportWorkflow(item);
                            }}
                            variant="ghost"
                            size="icon"
                            style={{
                              padding: '6px',
                              color: 'var(--cyber-neon-cyan)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Export"
                          >
                            <Download size={14} />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWorkflowFromLibrary(item.id, item.name);
                            }}
                            variant="ghost"
                            size="icon"
                            style={{
                              padding: '6px',
                              color: '#ff0040',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 0, 64, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </DialogContent>
      </Dialog>

    </>
  );
};

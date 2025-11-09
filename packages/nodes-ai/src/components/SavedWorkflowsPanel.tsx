import React, { useState, useEffect, useMemo, useImperativeHandle } from 'react';
import { Save, FolderOpen, Trash2, Download, Plus, X, Clock, FileCode, Search, Tag as TagIcon, Filter, CheckCircle2, Circle } from 'lucide-react';
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
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { useFlowStore } from '../hooks/useFlowStore';

interface SavedWorkflowsPanelProps {
  onLoad: (workflow: SavedWorkflow) => void;
  onSave: () => SavedWorkflow;
  currentWorkflowId?: string;
  nodes?: any[]; // For tracking state changes to trigger autosave
  edges?: any[]; // For tracking state changes to trigger autosave
}

export interface SavedWorkflowsPanelHandle {
  saveCurrentWorkflow: (name: string) => Promise<void>;
}

interface SavedWorkflowItem {
  id: string;
  name: string;
  updatedAt: number;
  workflow: SavedWorkflow;
}

// IndexedDB configuration for saved workflows library
interface WorkflowLibraryDB extends DBSchema {
  'saved-workflows': {
    key: string;
    value: SavedWorkflowItem;
  };
}

const DB_NAME = 'ai-workflow-library';
const STORE_NAME = 'saved-workflows';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WorkflowLibraryDB>> | null = null;

const getDB = (): Promise<IDBPDatabase<WorkflowLibraryDB>> => {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available'));
  }

  if (!dbPromise) {
    dbPromise = openDB<WorkflowLibraryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

// Autosave is always enabled - no preference key needed

export const SavedWorkflowsPanel = React.forwardRef<SavedWorkflowsPanelHandle, SavedWorkflowsPanelProps>(({
  onLoad,
  onSave,
  currentWorkflowId: propWorkflowId,
  nodes = [],
  edges = [],
}, ref) => {
  const notifications = useNotifications();
  const storeWorkflowId = useFlowStore((state) => state.metadata.id);
  const currentWorkflowId = storeWorkflowId || propWorkflowId;
  const [isOpen, setIsOpen] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflowItem[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // Autosave is always enabled - no preference needed
  const [workflowExistsInLibrary, setWorkflowExistsInLibrary] = useState(false);
  const autosaveEnabled = workflowExistsInLibrary; // Always enabled when workflow exists in library
  const autosaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedStateRef = React.useRef<string>('');

  // Removed autosave preference - autosave is always enabled

  useEffect(() => {
    console.log('SavedWorkflowsPanel active workflow ID:', currentWorkflowId);
  }, [currentWorkflowId]);
  // Load saved workflows from localStorage
  useEffect(() => {
    loadSavedWorkflows();
  }, []);

  // Reload when dialog opens to ensure we have latest data
  useEffect(() => {
    if (isOpen) {
      loadSavedWorkflows();
    }
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;
    const checkWorkflowExists = async () => {
      if (!currentWorkflowId) {
        if (isMounted) {
          setWorkflowExistsInLibrary(false);
        }
        return;
      }
      try {
        const db = await getDB();
        const existingItem = await db.get(STORE_NAME, currentWorkflowId);
        if (isMounted) {
          setWorkflowExistsInLibrary(!!existingItem);
        }
      } catch (error) {
        console.error('Failed to check workflow existence:', error);
        if (isMounted) {
          setWorkflowExistsInLibrary(false);
        }
      }
    };

    checkWorkflowExists();
    return () => {
      isMounted = false;
    };
  }, [currentWorkflowId, savedWorkflows.length]);

  // Autosave effect - triggers on workflow changes (debounced)
  useEffect(() => {
    if (!autosaveEnabled || !currentWorkflowId) {
      console.log('Autosave skipped:', { autosaveEnabled, currentWorkflowId });
      return;
    }

    // Create a hash of current state to detect actual changes
    const currentStateHash = JSON.stringify({
      nodeCount: nodes.length,
      edgeCount: edges.length,
      // Include node positions and data to detect moves/changes
      nodes: nodes.map(n => ({ id: n.id, x: n.position?.x, y: n.position?.y, type: n.type })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
    });

    // Skip if state hasn't changed
    if (currentStateHash === lastSavedStateRef.current) {
      console.log('Autosave skipped - no changes detected');
      return;
    }

    console.log('Autosave timer set:', { nodeCount: nodes.length, edgeCount: edges.length, workflowId: currentWorkflowId });

    // Clear existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Set new timer - autosave after 2 seconds of inactivity
    autosaveTimerRef.current = setTimeout(() => {
      console.log('Autosave triggered!');
      lastSavedStateRef.current = currentStateHash;
      autosaveWorkflow(currentWorkflowId);
    }, 2000);

    // Cleanup
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, currentWorkflowId, autosaveEnabled]);

  const loadSavedWorkflows = async () => {
    try {
      const db = await getDB();
      const allWorkflows = await db.getAll(STORE_NAME);
      console.log('Loaded workflows from IndexedDB:', allWorkflows.length);
      const sorted = allWorkflows.sort((a, b) => b.updatedAt - a.updatedAt);
      setSavedWorkflows(sorted);
      if (currentWorkflowId) {
        const exists = sorted.some((item) => item.id === currentWorkflowId);
        setWorkflowExistsInLibrary(exists);
      } else {
        setWorkflowExistsInLibrary(false);
      }
    } catch (error) {
      console.error('Failed to load saved workflows:', error);
      setSavedWorkflows([]);
      setWorkflowExistsInLibrary(false);
    }
  };

  useImperativeHandle(ref, () => ({
    saveCurrentWorkflow: async (name: string) => {
      const trimmed = name?.trim();
      if (!trimmed) {
        await notifications.showAlert('Please enter a workflow name', 'Save Workflow');
        return;
      }
      await saveWorkflowToLibrary(trimmed);
    },
  }));

  const saveWorkflowToLibrary = async (overrideName?: string) => {
    const targetName = (overrideName ?? saveName).trim();
    if (!targetName) {
      await notifications.showAlert('Please enter a workflow name', 'Save Workflow');
      return;
    }

    try {
      const workflow = onSave();
      
      // Generate a new unique ID for each save to allow multiple versions
      const savedWorkflowId = crypto.randomUUID();
      
      console.log('Saving workflow:', { id: savedWorkflowId, name: targetName, nodes: workflow.flow.nodes.length, edges: workflow.flow.edges.length });
      
      const now = Date.now();
      const item: SavedWorkflowItem = {
        id: savedWorkflowId,
        name: targetName,
        updatedAt: now,
        workflow: {
          ...workflow,
          metadata: {
            ...workflow.metadata,
            id: savedWorkflowId, // ensure store id matches library id
            name: targetName,
            updatedAt: now,
          },
        },
      };

      const db = await getDB();
      await db.put(STORE_NAME, item, item.id);
      console.log('Saved to IndexedDB:', item.id);
      
      // Reload workflows from DB to keep state in sync
      await loadSavedWorkflows();
      
      if (!overrideName) {
        setSaveDialogOpen(false);
      }
      setSaveName('');

      // Immediately load the saved workflow so the current workflowId matches the library item id
      onLoad(item.workflow);

      // Workflow is now in library, autosave is enabled
      setWorkflowExistsInLibrary(true);

      // Initialize the saved state reference
      lastSavedStateRef.current = JSON.stringify({
        nodeCount: item.workflow.flow.nodes.length,
        edgeCount: item.workflow.flow.edges.length,
        nodes: item.workflow.flow.nodes.map(n => ({ id: n.id, x: n.position?.x, y: n.position?.y, type: n.type })),
        edges: item.workflow.flow.edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
      });
      
      notifications.showToast('Workflow saved successfully! Autosave enabled.', 'success');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      notifications.showToast('Failed to save workflow', 'destructive');
    }
  };

  // Autosave function - updates existing workflow
  const autosaveWorkflow = async (workflowId: string) => {
    if (!workflowId || !autosaveEnabled) return;
    
    try {
      const workflow = onSave();
      const db = await getDB();
      
      // Get existing workflow
      const existingItem = await db.get(STORE_NAME, workflowId);
      if (!existingItem) {
        console.warn('Autosave: workflow not found', workflowId);
        setWorkflowExistsInLibrary(false);
        return;
      }
      
      // Update existing workflow
      const updatedItem: SavedWorkflowItem = {
        ...existingItem,
        updatedAt: Date.now(),
        workflow: {
          ...workflow,
          metadata: {
            ...workflow.metadata,
            id: workflowId, // Preserve the loaded workflow ID
            name: existingItem.name, // Keep original name
            updatedAt: Date.now(),
          },
        },
      };
      
      await db.put(STORE_NAME, updatedItem, updatedItem.id);
      console.log('Autosaved workflow:', workflowId);
      setWorkflowExistsInLibrary(true);
      
      // Silently reload to sync state
      await loadSavedWorkflows();
    } catch (error) {
      console.error('Autosave failed:', error);
    }
  };

  const loadWorkflowFromLibrary = async (item: SavedWorkflowItem) => {
    try {
      console.log('Loading workflow:', item.name, item.id);
      
      const workflowToLoad: SavedWorkflow = {
        ...item.workflow,
        metadata: {
          ...item.workflow.metadata,
          id: item.id,
        },
      };
      
      onLoad(workflowToLoad);
      // Workflow is loaded from library, so it exists - autosave is enabled
      setWorkflowExistsInLibrary(true);
      setIsOpen(false);
      await loadSavedWorkflows();
      
      lastSavedStateRef.current = JSON.stringify({
        nodeCount: item.workflow.flow.nodes.length,
        edgeCount: item.workflow.flow.edges.length,
        nodes: item.workflow.flow.nodes.map(n => ({ id: n.id, x: n.position?.x, y: n.position?.y, type: n.type })),
        edges: item.workflow.flow.edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
      });
      
      notifications.showToast(`Loaded workflow "${item.name}" - Autosave enabled`, 'success');
    } catch (error) {
      console.error('Failed to load workflow:', error);
      notifications.showToast('Failed to load workflow', 'destructive');
    }
  };

  const deleteWorkflowFromLibrary = async (id: string, name: string) => {
    const confirmed = await notifications.showConfirm(
      `Delete workflow "${name}"? This cannot be undone.`,
      'Delete Workflow'
    );
    if (confirmed) {
      try {
        const db = await getDB();
        await db.delete(STORE_NAME, id);
        console.log('Deleted workflow from IndexedDB:', id);
        
        // Reload workflows from DB
        await loadSavedWorkflows();
        if (id === currentWorkflowId) {
          setWorkflowExistsInLibrary(false);
        }
        
        notifications.showToast(`Deleted "${name}"`, 'success');
      } catch (error) {
        console.error('Failed to delete workflow:', error);
        notifications.showToast('Failed to delete workflow', 'destructive');
      }
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
        variant="secondary"
        size="sm"
        className="h-9 px-4 font-medium"
        title="Saved workflows"
      >
        <FolderOpen size={16} strokeWidth={2} />
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
            <DialogTitle style={{ 
              fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}>
              Save Workflow
            </DialogTitle>
            <DialogDescription style={{ 
              fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
              fontSize: '13px',
              letterSpacing: '-0.01em',
            }}>
              Enter a name for your workflow
            </DialogDescription>
          </DialogHeader>
          <div style={{ marginTop: '24px', marginBottom: '24px' }}>
            <Label
              htmlFor="workflow-name"
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--cyber-neon-purple)',
                marginBottom: '8px',
                fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
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
                fontWeight: 500,
                letterSpacing: '-0.01em',
                height: '40px',
              }}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setSaveDialogOpen(false)}
              variant="outline"
              size="sm"
              className="h-9 px-4 font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveWorkflowToLibrary()}
              variant="default"
              size="sm"
              className="h-9 px-4 font-medium"
            >
              <Save size={16} strokeWidth={2} />
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
              padding: '20px 24px',
              borderBottom: '1px solid rgba(176, 38, 255, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <DialogTitle
                  style={{
                    fontSize: '22px',
                    fontWeight: 600,
                    color: 'var(--cyber-neon-cyan)',
                    fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                    letterSpacing: '-0.02em',
                    textShadow: '0 0 8px rgba(0, 240, 255, 0.3)',
                    marginBottom: '6px',
                  }}
                >
                  Saved Workflows
                </DialogTitle>
                <DialogDescription
                  style={{
                    fontSize: '13px',
                    color: 'rgba(136, 136, 136, 0.9)',
                    fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {filteredWorkflows.length} of {savedWorkflows.length} workflow{savedWorkflows.length !== 1 ? 's' : ''}
                </DialogDescription>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Button
                  variant={autosaveEnabled ? 'default' : 'outline-solid'}
                  size="sm"
                  disabled={!workflowExistsInLibrary}
                  className="h-9 px-4 font-medium"
                  style={{
                    fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title={
                    workflowExistsInLibrary
                      ? 'Autosave is enabled for this workflow'
                      : 'Save this workflow to enable autosave'
                  }
                >
                  {autosaveEnabled ? <CheckCircle2 size={16} strokeWidth={2} /> : <Circle size={16} strokeWidth={2} />}
                  {workflowExistsInLibrary ? 'Autosave On' : 'Autosave Unavailable'}
                </Button>
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    setSaveDialogOpen(true);
                  }}
                  variant="default"
                  size="sm"
                  className="h-9 px-4 font-medium"
                  style={{
                    fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={16} strokeWidth={2} />
                  Save Current
                </Button>
              </div>
            </div>
          </DialogHeader>

            {/* Search and Filters */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(176, 38, 255, 0.25)' }}>
              {/* Search */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={16}
                    strokeWidth={2}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(136, 136, 136, 0.6)',
                    }}
                  />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search workflows..."
                    style={{
                      width: '100%',
                      paddingLeft: '42px',
                      paddingRight: '14px',
                      paddingTop: '10px',
                      paddingBottom: '10px',
                      fontSize: '14px',
                      fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                      fontWeight: 500,
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(176, 38, 255, 0.3)',
                      borderRadius: '8px',
                      color: 'var(--cyber-neon-cyan)',
                      outline: 'none',
                      height: '40px',
                      letterSpacing: '-0.01em',
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
                      gap: '10px',
                      marginBottom: '12px',
                    }}
                  >
                    <Filter size={16} strokeWidth={2} style={{ color: 'rgba(136, 136, 136, 0.6)' }} />
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--cyber-neon-purple)',
                        fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: 600,
                      }}
                    >
                      Filter by Tags:
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    {allTags.map((tag) => (
                      <Button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        variant={selectedTags.includes(tag) ? "default" : "outline-solid"}
                        size="sm"
                        className="h-8"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                          fontWeight: 500,
                          background: selectedTags.includes(tag)
                            ? 'rgba(0, 240, 255, 0.15)'
                            : 'rgba(176, 38, 255, 0.08)',
                          border: selectedTags.includes(tag)
                            ? '1px solid var(--cyber-neon-cyan)'
                            : '1px solid rgba(176, 38, 255, 0.25)',
                          borderRadius: '6px',
                          color: selectedTags.includes(tag)
                            ? 'var(--cyber-neon-cyan)'
                            : 'var(--cyber-neon-purple)',
                          letterSpacing: '-0.01em',
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedTags.includes(tag)) {
                            e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedTags.includes(tag)) {
                            e.currentTarget.style.background = 'rgba(176, 38, 255, 0.08)';
                          }
                        }}
                      >
                        <TagIcon size={12} strokeWidth={2} />
                        {tag}
                      </Button>
                    ))}
                    {selectedTags.length > 0 && (
                      <Button
                        onClick={() => setSelectedTags([])}
                        variant="outline"
                        size="sm"
                        className="h-8"
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                          fontWeight: 500,
                          background: 'rgba(255, 0, 64, 0.08)',
                          border: '1px solid rgba(255, 0, 64, 0.25)',
                          borderRadius: '6px',
                          color: '#ff0040',
                          letterSpacing: '-0.01em',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 0, 64, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 0, 64, 0.08)';
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
                      onClick={(e) => {
                        console.log('Workflow card clicked:', item.name, item.id);
                        loadWorkflowFromLibrary(item);
                      }}
                      style={{
                        position: 'relative',
                        padding: '18px',
                        borderRadius: '10px',
                        border: item.id === currentWorkflowId
                          ? '1.5px solid var(--cyber-neon-cyan)'
                          : '1px solid rgba(176, 38, 255, 0.25)',
                        background: item.id === currentWorkflowId
                          ? 'rgba(0, 240, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (item.id !== currentWorkflowId) {
                          e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.5)';
                          e.currentTarget.style.background = 'rgba(176, 38, 255, 0.08)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (item.id !== currentWorkflowId) {
                          e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.25)';
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <FileCode
                              size={18}
                              strokeWidth={2}
                              style={{
                                color: 'var(--cyber-neon-cyan)',
                                flexShrink: 0,
                              }}
                            />
                            <h4
                              style={{
                                fontSize: '15px',
                                fontWeight: 600,
                                color: 'var(--cyber-neon-cyan)',
                                fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                                letterSpacing: '-0.02em',
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
                                  padding: '3px 8px',
                                  background: 'rgba(0, 240, 255, 0.15)',
                                  color: 'var(--cyber-neon-cyan)',
                                  border: '1px solid var(--cyber-neon-cyan)',
                                  fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                                  fontWeight: 600,
                                  letterSpacing: '0.5px',
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
                                gap: '6px',
                                marginBottom: '10px',
                                marginLeft: '28px',
                              }}
                            >
                              {item.workflow.metadata.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  style={{
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                                    fontWeight: 500,
                                    background: 'rgba(176, 38, 255, 0.12)',
                                    color: 'var(--cyber-neon-purple)',
                                    border: '1px solid rgba(176, 38, 255, 0.25)',
                                    letterSpacing: '-0.01em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <TagIcon size={10} strokeWidth={2} />
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
                              fontSize: '12px',
                              color: 'rgba(136, 136, 136, 0.9)',
                              fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                              fontWeight: 500,
                              marginLeft: '28px',
                              marginBottom: '6px',
                              letterSpacing: '-0.01em',
                            }}
                          >
                            <span>{item.workflow.flow.nodes.length} nodes</span>
                            <span style={{ opacity: 0.5 }}>•</span>
                            <span>{item.workflow.flow.edges.length} edges</span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11px',
                              color: 'rgba(136, 136, 136, 0.7)',
                              fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
                              fontWeight: 500,
                              marginLeft: '28px',
                              letterSpacing: '-0.01em',
                            }}
                          >
                            <Clock size={12} strokeWidth={2} />
                            <span>{formatDate(item.updatedAt)}</span>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: 0,
                            transition: 'opacity 0.15s ease',
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
                            className="h-9 w-9"
                            style={{
                              color: 'var(--cyber-neon-cyan)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Export workflow"
                          >
                            <Download size={16} strokeWidth={2} />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWorkflowFromLibrary(item.id, item.name);
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            style={{
                              color: '#ff0040',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 0, 64, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Delete workflow"
                          >
                            <Trash2 size={16} strokeWidth={2} />
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
});

SavedWorkflowsPanel.displayName = 'SavedWorkflowsPanel';

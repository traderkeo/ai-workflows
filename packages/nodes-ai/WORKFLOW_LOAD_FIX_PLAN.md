# Workflow Save/Load Fix Plan

## Executive Summary

This document details the root causes and fixes for workflow save/load functionality issues in the `packages/nodes-ai` package, including:

1. **Dark screen when clicking "Load"** - Dialog overlay stacking issue
2. **Workflow not changing after load** - State synchronization issue
3. **Autosave not working consistently** - State management issue
4. **"CURRENT" badge not updating** - ID mismatch issue

---

## Issue #1: Dark Screen / Dialog Stacking Problem

### Root Cause

**File**: `packages/nodes-ai/src/components/SavedWorkflowsPanel.tsx:254-306`

When a user clicks to load a workflow:

```typescript
const loadWorkflowFromLibrary = async (item: SavedWorkflowItem) => {
  try {
    // Line 256-257: Close the main dialog first
    setIsOpen(false);

    // Line 259-260: Small delay to ensure dialog closes
    await new Promise(resolve => setTimeout(resolve, 100));

    // Line 262-265: Show confirm dialog
    const confirmed = await notifications.showConfirm(
      `Load workflow "${item.name}"? Current workflow will be replaced.`,
      'Load Workflow'
    );
    // ...
```

**The Problem:**
1. SavedWorkflowsPanel Dialog closes (`setIsOpen(false)`)
2. After 100ms delay, a Confirm Dialog opens
3. **However**, Radix UI Dialog overlays don't clean up instantly
4. The confirm dialog (AlertDialog from shadcn/ui) creates its own overlay
5. Result: **Two overlays stack**, causing the dark screen
6. Sometimes the confirm dialog doesn't render properly behind the lingering overlay

**Why It Fails:**
- Radix UI Dialog has unmount animations that take ~150-200ms
- The 100ms delay is insufficient for the first overlay to fully unmount
- When the second dialog opens, both overlays exist briefly
- The stacked overlays block interaction and create visual issues

### Solution

**Option 1: Increase Delay (Quick Fix)**

```typescript
// Line 259-260: Increase delay from 100ms to 300ms
await new Promise(resolve => setTimeout(resolve, 300));
```

**Impact**: ⚠️ Adds noticeable delay, poor UX

**Option 2: Don't Close Main Dialog (Recommended)**

Keep the SavedWorkflowsPanel open and show the confirm dialog on top:

```typescript
const loadWorkflowFromLibrary = async (item: SavedWorkflowItem) => {
  try {
    // DON'T close the main dialog
    // setIsOpen(false); // ❌ Remove this line

    // Remove the delay
    // await new Promise(resolve => setTimeout(resolve, 100)); // ❌ Remove this

    // Show confirm dialog immediately
    const confirmed = await notifications.showConfirm(
      `Load workflow "${item.name}"? Current workflow will be replaced.`,
      'Load Workflow'
    );

    if (confirmed) {
      console.log('Loading workflow:', item.name, item.id);

      // Update the workflow metadata to match the saved workflow item ID
      const workflowToLoad: SavedWorkflow = {
        ...item.workflow,
        metadata: {
          ...item.workflow.metadata,
          id: item.id,
        },
      };

      // Load the workflow
      onLoad(workflowToLoad);

      // NOW close the main dialog after successful load
      setIsOpen(false);

      // Enable autosave for loaded workflows
      setAutosaveEnabled(true);

      // Initialize the saved state reference
      lastSavedStateRef.current = JSON.stringify({
        nodeCount: item.workflow.flow.nodes.length,
        edgeCount: item.workflow.flow.edges.length,
        nodes: item.workflow.flow.nodes.map(n => ({ id: n.id, x: n.position?.x, y: n.position?.y, type: n.type })),
        edges: item.workflow.flow.edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
      });

      // Show success notification
      notifications.showToast(`Loaded workflow "${item.name}" - Autosave enabled`, 'success');
    }
    // If cancelled, dialog stays open naturally
  } catch (error) {
    console.error('Failed to load workflow:', error);
    notifications.showToast('Failed to load workflow', 'destructive');
    // Don't reopen - it's already open
  }
};
```

**Benefits**: ✅ No delays, ✅ Better UX, ✅ No overlay stacking

**Option 3: Use Portal Container Strategy**

Ensure confirm dialogs render in a specific portal that's always on top:

```typescript
// In apps/web/src/app/workflow-builder/page.tsx
// Add a portal container
<div id="dialog-portal-root" style={{ position: 'relative', zIndex: 9999 }} />

// Modify confirm dialog to use specific portal
<AlertDialog open={confirmDialog.confirmOpen} onOpenChange={/* ... */}>
  <AlertDialogContent
    container={document.getElementById('dialog-portal-root')}
    style={{ zIndex: 9999 }}
  >
    {/* ... */}
  </AlertDialogContent>
</AlertDialog>
```

**Impact**: More complex, requires app-level changes

### Recommended Fix

**Use Option 2** - Don't close the main dialog before showing confirm. This is the cleanest solution with best UX.

---

## Issue #2: Workflow Not Changing / "CURRENT" Badge Not Updating

### Root Cause

**File**: `packages/nodes-ai/src/components/SavedWorkflowsPanel.tsx:797, 844`

The "CURRENT" badge and workflow loading logic depends on ID matching:

```typescript
// Line 797, 844: Check if this is the current workflow
item.id === currentWorkflowId
```

**The Problem:**

1. When a workflow is saved, it gets a new UUID: `crypto.randomUUID()` (line 162)
2. This ID is stored as `item.id` in IndexedDB
3. The workflow metadata also has an `id` field
4. **However**, the `currentWorkflowId` prop comes from `metadata.id` in the store
5. When loading, the code tries to set `metadata.id` to match `item.id` (lines 275-277)
6. **But**, the store's `loadWorkflow` function might not be properly updating the metadata ID

**File**: `packages/nodes-ai/src/hooks/useFlowStore.ts:312-322`

```typescript
loadWorkflow: (workflow) => {
  // Batch state updates to prevent multiple re-renders
  set({
    nodes: workflow.flow.nodes,
    edges: workflow.flow.edges,
    viewport: workflow.flow.viewport,
    metadata: workflow.metadata, // ✅ This SHOULD work
    history: [],
    historyIndex: -1,
  });
},
```

The store DOES set the metadata correctly, so the issue might be:

1. **Timing**: The `currentWorkflowId` prop in WorkflowToolbar might not be reactive
2. **Stale closure**: The SavedWorkflowsPanel might be reading a stale `currentWorkflowId`
3. **ID mismatch**: The IDs might genuinely not match due to the workflow loading process

### Investigation Steps

Check if the issue is:

**A. WorkflowCanvas not passing updated ID**

`packages/nodes-ai/src/components/WorkflowCanvas.tsx:252`

```typescript
<WorkflowToolbar
  workflowName={metadata.name}
  workflowId={metadata.id}  // ⚠️ Is this reactive?
  // ...
/>
```

Since `metadata` comes from `useFlowStore()`, this should be reactive. But let's verify:

```typescript
// Line 88
metadata,
```

This is destructured from the store, which can cause stale values if the store uses a shallow comparison.

**B. SavedWorkflowsPanel receiving stale prop**

`packages/nodes-ai/src/components/_components/WorkflowToolbar.tsx:134`

```typescript
<SavedWorkflowsPanel
  onSave={onSaveWorkflow}
  onLoad={onLoadWorkflow}
  currentWorkflowId={workflowId}  // ⚠️ Prop passed down
  nodes={nodes}
  edges={edges}
/>
```

This should work, but React might not re-render if the reference doesn't change.

### Solution

**Fix 1: Ensure Store Metadata is Properly Updated**

Verify the `loadWorkflow` function in the store is correctly setting metadata:

```typescript
// packages/nodes-ai/src/hooks/useFlowStore.ts
loadWorkflow: (workflow) => {
  console.log('Loading workflow with ID:', workflow.metadata.id); // DEBUG

  set({
    nodes: workflow.flow.nodes,
    edges: workflow.flow.edges,
    viewport: workflow.flow.viewport,
    metadata: {
      ...workflow.metadata,
      // Ensure the ID is definitely set
      id: workflow.metadata.id,
      updatedAt: Date.now(),
    },
    history: [],
    historyIndex: -1,
  });

  console.log('Store metadata after load:', get().metadata.id); // DEBUG
},
```

**Fix 2: Force Re-render in SavedWorkflowsPanel**

Add a key to the component based on currentWorkflowId:

```typescript
// In WorkflowToolbar.tsx
<SavedWorkflowsPanel
  key={workflowId}  // ✅ Force re-render when ID changes
  onSave={onSaveWorkflow}
  onLoad={onLoadWorkflow}
  currentWorkflowId={workflowId}
  nodes={nodes}
  edges={edges}
/>
```

**Fix 3: Use Store Selector in SavedWorkflowsPanel**

Instead of relying on props, read directly from store:

```typescript
// In SavedWorkflowsPanel.tsx
import { useFlowStore } from '../hooks/useFlowStore';

export const SavedWorkflowsPanel: React.FC<SavedWorkflowsPanelProps> = ({
  onLoad,
  onSave,
  currentWorkflowId: propWorkflowId, // Rename prop
  nodes = [],
  edges = [],
}) => {
  // Read directly from store for most up-to-date value
  const storeWorkflowId = useFlowStore((state) => state.metadata.id);
  const currentWorkflowId = storeWorkflowId || propWorkflowId;

  // ... rest of component
```

**Recommended:** Use **Fix 3** - Read from store directly for guaranteed fresh data

---

## Issue #3: Autosave Not Working Consistently

### Root Cause

**File**: `packages/nodes-ai/src/components/SavedWorkflowsPanel.tsx:79, 96-138`

Autosave state is managed in the SavedWorkflowsPanel component:

```typescript
const [autosaveEnabled, setAutosaveEnabled] = useState(false);
```

**The Problem:**

1. Autosave is **component-level state**, not persisted
2. It's only enabled when:
   - Saving a workflow through SavedWorkflowsPanel (line 196)
   - Loading a workflow from SavedWorkflowsPanel (line 284)
3. **It's NOT enabled when:**
   - User creates a new workflow from scratch
   - User imports a workflow from JSON file
   - Page refreshes (state is lost)
   - Component remounts

**Result**: Users expect autosave to always work, but it only works in specific scenarios.

### Solution

**Option 1: Always Enable Autosave (Recommended)**

```typescript
// Change default state to true
const [autosaveEnabled, setAutosaveEnabled] = useState(true);
```

**But wait** - this will auto-save untitled workflows that aren't in the library yet.

Better approach:

```typescript
// Enable autosave only if currentWorkflowId exists in library
const [autosaveEnabled, setAutosaveEnabled] = useState(false);

useEffect(() => {
  // Check if current workflow exists in library
  const checkWorkflowExists = async () => {
    if (!currentWorkflowId) {
      setAutosaveEnabled(false);
      return;
    }

    try {
      const db = await getDB();
      const existingItem = await db.get(STORE_NAME, currentWorkflowId);
      setAutosaveEnabled(!!existingItem);
    } catch (error) {
      console.error('Failed to check workflow existence:', error);
      setAutosaveEnabled(false);
    }
  };

  checkWorkflowExists();
}, [currentWorkflowId]);
```

**Option 2: Persist Autosave State**

Store autosave preference in localStorage or workflow metadata:

```typescript
const [autosaveEnabled, setAutosaveEnabled] = useState(() => {
  // Read from localStorage on mount
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('autosave-enabled');
    return stored ? JSON.parse(stored) : false;
  }
  return false;
});

// Save to localStorage when changed
useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('autosave-enabled', JSON.stringify(autosaveEnabled));
  }
}, [autosaveEnabled]);
```

**Option 3: Add Manual Autosave Toggle (Best UX)**

Add a toggle button so users can control autosave:

```tsx
// In SavedWorkflowsPanel, add toggle button
<Button
  onClick={() => setAutosaveEnabled(!autosaveEnabled)}
  variant={autosaveEnabled ? "default" : "outline"}
  size="sm"
  title={autosaveEnabled ? "Autosave enabled" : "Autosave disabled"}
>
  {autosaveEnabled ? <CheckCircle size={16} /> : <Circle size={16} />}
  Autosave {autosaveEnabled ? 'On' : 'Off'}
</Button>
```

**Recommended**: Combine **Option 1** (auto-detect) + **Option 3** (manual toggle)

---

## Issue #4: Import from JSON File Doesn't Enable Autosave

### Root Cause

**File**: `packages/nodes-ai/src/components/WorkflowCanvas.tsx:139-163`

When importing a workflow from JSON file:

```typescript
const handleFileChange = useCallback(
  async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        importWorkflow(json); // ⚠️ Loads workflow but doesn't save to library
        setTimeout(() => fitView(), 100);
        notifications.showToast('Workflow loaded successfully!', 'success');
      } catch (error) {
        notifications.showToast('Failed to load workflow. Invalid file format.', 'destructive');
      }
    };
    reader.readAsText(file);
    // ...
  },
  [importWorkflow, fitView, notifications]
);
```

**The Problem:**

1. `importWorkflow` calls store's `importWorkflow` which calls `loadWorkflow`
2. `loadWorkflow` sets nodes, edges, and metadata
3. **But** the workflow is not saved to the SavedWorkflowsPanel's IndexedDB library
4. Therefore, autosave never gets enabled for this workflow
5. The workflow has a new `metadata.id` but it's not in the library

### Solution

**Option 1: Automatically Save Imported Workflows to Library**

Modify the import handler to also save to library:

```typescript
const handleFileChange = useCallback(
  async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        const workflow = JSON.parse(json);

        // Import to store first
        importWorkflow(json);

        // Then prompt to save to library
        const shouldSave = await notifications.showConfirm(
          'Would you like to save this imported workflow to your library for autosave?',
          'Save to Library'
        );

        if (shouldSave) {
          const name = await notifications.showPrompt(
            'Enter a name for this workflow:',
            workflow.metadata?.name || 'Imported Workflow'
          );

          if (name) {
            // Save to library (call SavedWorkflowsPanel's save function)
            // Need to expose a way to trigger save from outside
            // See Option 2 below for better approach
          }
        }

        setTimeout(() => fitView(), 100);
        notifications.showToast('Workflow loaded successfully!', 'success');
      } catch (error) {
        notifications.showToast('Failed to load workflow. Invalid file format.', 'destructive');
      }
    };
    reader.readAsText(file);
  },
  [importWorkflow, fitView, notifications]
);
```

**Option 2: Expose Save Function from SavedWorkflowsPanel**

Add an imperative handle to SavedWorkflowsPanel:

```typescript
// SavedWorkflowsPanel.tsx
export interface SavedWorkflowsPanelHandle {
  saveCurrentWorkflow: (name: string) => Promise<void>;
}

export const SavedWorkflowsPanel = React.forwardRef<SavedWorkflowsPanelHandle, SavedWorkflowsPanelProps>(
  ({ onLoad, onSave, currentWorkflowId, nodes, edges }, ref) => {
    // ... existing code

    // Expose save function via ref
    React.useImperativeHandle(ref, () => ({
      saveCurrentWorkflow: async (name: string) => {
        setSaveName(name);
        await saveWorkflowToLibrary();
      },
    }));

    // ... rest of component
  }
);
```

Then in WorkflowCanvas:

```typescript
const savedWorkflowsPanelRef = useRef<SavedWorkflowsPanelHandle>(null);

// In handleFileChange:
if (shouldSave && name) {
  await savedWorkflowsPanelRef.current?.saveCurrentWorkflow(name);
}

// In render:
<SavedWorkflowsPanel
  ref={savedWorkflowsPanelRef}
  // ... props
/>
```

**Recommended**: Use **Option 1** with simplified UX - Auto-prompt to save after import

---

## Testing Checklist

After implementing fixes, test the following scenarios:

### Load Workflow Tests

- [ ] Click "Saved" button - dialog opens without dark screen
- [ ] Click on a workflow - confirm dialog appears (no dark screen)
- [ ] Click "Confirm" - workflow loads successfully
- [ ] Verify "CURRENT" badge shows on loaded workflow
- [ ] Click "Saved" again - correct workflow has "CURRENT" badge
- [ ] Cancel confirm dialog - returns to saved workflows list (no dark screen)
- [ ] Load different workflow - "CURRENT" badge moves to new workflow

### Autosave Tests

- [ ] Save a new workflow - autosave enables automatically
- [ ] Make changes to nodes - check console logs show autosave after 2 seconds
- [ ] Reload page - verify autosave is still enabled (if using persistent option)
- [ ] Create new workflow (not saved) - verify autosave is disabled
- [ ] Manual toggle (if implemented) - verify autosave can be enabled/disabled

### Import Tests

- [ ] Import JSON workflow - loads successfully
- [ ] After import - verify prompted to save to library (if implemented)
- [ ] Save imported workflow - verify autosave is enabled
- [ ] Don't save imported workflow - verify autosave stays disabled

### Edge Cases

- [ ] Open multiple workflows quickly - no dialog stacking
- [ ] Network interruption during IndexedDB operation - graceful error handling
- [ ] Very large workflows (50+ nodes) - autosave performance acceptable
- [ ] Rapid node changes - autosave debouncing works correctly
- [ ] Delete currently loaded workflow - handle gracefully

---

## Implementation Priority

### Phase 1: Critical Fixes (High Priority) 🔴

**Estimated Time: 2-3 hours**

1. **Fix Dark Screen Issue**
   - File: `SavedWorkflowsPanel.tsx:254-306`
   - Change: Don't close main dialog before confirm
   - Impact: ⭐⭐⭐⭐⭐ (Breaks core functionality)
   - Effort: 15 minutes

2. **Fix "CURRENT" Badge Not Updating**
   - File: `SavedWorkflowsPanel.tsx:65-71`
   - Change: Read `currentWorkflowId` from store directly
   - Impact: ⭐⭐⭐⭐⭐ (User confusion)
   - Effort: 30 minutes

3. **Add Debug Logging**
   - Files: `useFlowStore.ts`, `SavedWorkflowsPanel.tsx`
   - Change: Add console.logs to track IDs
   - Impact: ⭐⭐⭐⭐ (Helps diagnose issues)
   - Effort: 15 minutes

### Phase 2: Autosave Improvements (Medium Priority) 🟡

**Estimated Time: 3-4 hours**

4. **Auto-detect Autosave State**
   - File: `SavedWorkflowsPanel.tsx:79, 96`
   - Change: Check if workflow exists in library on mount
   - Impact: ⭐⭐⭐⭐ (Better UX)
   - Effort: 1 hour

5. **Add Autosave Toggle UI**
   - File: `SavedWorkflowsPanel.tsx:375-395`
   - Change: Add toggle button for autosave
   - Impact: ⭐⭐⭐ (User control)
   - Effort: 1 hour

6. **Persist Autosave Preference**
   - File: `SavedWorkflowsPanel.tsx:79`
   - Change: Store preference in localStorage
   - Impact: ⭐⭐⭐ (Consistency across sessions)
   - Effort: 30 minutes

### Phase 3: Import Enhancements (Low Priority) 🟢

**Estimated Time: 2-3 hours**

7. **Prompt to Save Imports**
   - File: `WorkflowCanvas.tsx:139-163`
   - Change: Ask to save imported workflows
   - Impact: ⭐⭐⭐ (Better workflow)
   - Effort: 1.5 hours

8. **Expose Imperative Save API**
   - File: `SavedWorkflowsPanel.tsx`
   - Change: Use `forwardRef` and `useImperativeHandle`
   - Impact: ⭐⭐ (Developer experience)
   - Effort: 1 hour

---

## Code Changes Summary

### File 1: SavedWorkflowsPanel.tsx

**Location**: Lines 254-306

**Before:**
```typescript
const loadWorkflowFromLibrary = async (item: SavedWorkflowItem) => {
  try {
    setIsOpen(false); // ❌ Causes dark screen
    await new Promise(resolve => setTimeout(resolve, 100));
    const confirmed = await notifications.showConfirm(/*...*/);
    if (confirmed) {
      onLoad(workflowToLoad);
      setAutosaveEnabled(true);
      notifications.showToast(/*...*/);
    } else {
      setIsOpen(true); // ❌ Re-open dialog
    }
  } catch (error) {
    setIsOpen(true); // ❌ Re-open dialog
  }
};
```

**After:**
```typescript
const loadWorkflowFromLibrary = async (item: SavedWorkflowItem) => {
  try {
    // DON'T close dialog before confirm ✅
    const confirmed = await notifications.showConfirm(
      `Load workflow "${item.name}"? Current workflow will be replaced.`,
      'Load Workflow'
    );

    if (confirmed) {
      console.log('Loading workflow:', item.name, item.id);

      const workflowToLoad: SavedWorkflow = {
        ...item.workflow,
        metadata: {
          ...item.workflow.metadata,
          id: item.id,
        },
      };

      onLoad(workflowToLoad);
      setIsOpen(false); // ✅ Close only after successful load
      setAutosaveEnabled(true);

      lastSavedStateRef.current = JSON.stringify({
        nodeCount: item.workflow.flow.nodes.length,
        edgeCount: item.workflow.flow.edges.length,
        nodes: item.workflow.flow.nodes.map(n => ({ id: n.id, x: n.position?.x, y: n.position?.y, type: n.type })),
        edges: item.workflow.flow.edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
      });

      notifications.showToast(`Loaded workflow "${item.name}" - Autosave enabled`, 'success');
    }
    // Dialog stays open if cancelled - no need to reopen ✅
  } catch (error) {
    console.error('Failed to load workflow:', error);
    notifications.showToast('Failed to load workflow', 'destructive');
    // Dialog is still open - no need to reopen ✅
  }
};
```

**Location**: Lines 65-71

**Before:**
```typescript
export const SavedWorkflowsPanel: React.FC<SavedWorkflowsPanelProps> = ({
  onLoad,
  onSave,
  currentWorkflowId,
  nodes = [],
  edges = [],
}) => {
  // Uses prop directly ❌
```

**After:**
```typescript
export const SavedWorkflowsPanel: React.FC<SavedWorkflowsPanelProps> = ({
  onLoad,
  onSave,
  currentWorkflowId: propWorkflowId,
  nodes = [],
  edges = [],
}) => {
  // Read from store for fresh data ✅
  const storeWorkflowId = useFlowStore((state) => state.metadata.id);
  const currentWorkflowId = storeWorkflowId || propWorkflowId;

  console.log('SavedWorkflowsPanel - currentWorkflowId:', currentWorkflowId);
```

**Location**: Lines 79-100

**Before:**
```typescript
const [autosaveEnabled, setAutosaveEnabled] = useState(false);
```

**After:**
```typescript
const [autosaveEnabled, setAutosaveEnabled] = useState(false);

// Auto-detect if workflow exists in library ✅
useEffect(() => {
  const checkWorkflowExists = async () => {
    if (!currentWorkflowId) {
      console.log('Autosave disabled - no current workflow ID');
      setAutosaveEnabled(false);
      return;
    }

    try {
      const db = await getDB();
      const existingItem = await db.get(STORE_NAME, currentWorkflowId);
      const exists = !!existingItem;
      console.log('Autosave check:', { currentWorkflowId, exists });
      setAutosaveEnabled(exists);
    } catch (error) {
      console.error('Failed to check workflow existence:', error);
      setAutosaveEnabled(false);
    }
  };

  checkWorkflowExists();
}, [currentWorkflowId]);
```

### File 2: useFlowStore.ts

**Location**: Lines 312-322

**Before:**
```typescript
loadWorkflow: (workflow) => {
  set({
    nodes: workflow.flow.nodes,
    edges: workflow.flow.edges,
    viewport: workflow.flow.viewport,
    metadata: workflow.metadata,
    history: [],
    historyIndex: -1,
  });
},
```

**After:**
```typescript
loadWorkflow: (workflow) => {
  console.log('Store loading workflow:', {
    id: workflow.metadata.id,
    name: workflow.metadata.name,
    nodes: workflow.flow.nodes.length,
    edges: workflow.flow.edges.length,
  });

  set({
    nodes: workflow.flow.nodes,
    edges: workflow.flow.edges,
    viewport: workflow.flow.viewport,
    metadata: {
      ...workflow.metadata,
      id: workflow.metadata.id, // Explicitly set ID ✅
      updatedAt: Date.now(),
    },
    history: [],
    historyIndex: -1,
  });

  console.log('Store after load:', {
    metadataId: get().metadata.id,
    nodesCount: get().nodes.length,
  });
},
```

### File 3: WorkflowToolbar.tsx (Optional)

**Location**: Lines 130-137

**Before:**
```typescript
<SavedWorkflowsPanel
  onSave={onSaveWorkflow}
  onLoad={onLoadWorkflow}
  currentWorkflowId={workflowId}
  nodes={nodes}
  edges={edges}
/>
```

**After:**
```typescript
<SavedWorkflowsPanel
  key={workflowId} // ✅ Force re-render when ID changes
  onSave={onSaveWorkflow}
  onLoad={onLoadWorkflow}
  currentWorkflowId={workflowId}
  nodes={nodes}
  edges={edges}
/>
```

---

## Additional Improvements (Optional)

### 1. Add Autosave Status Indicator

Show users when autosave is happening:

```tsx
// In SavedWorkflowsPanel
const [lastAutosaveTime, setLastAutosaveTime] = useState<number | null>(null);

// In autosaveWorkflow function:
const autosaveWorkflow = async (workflowId: string) => {
  // ... existing code
  setLastAutosaveTime(Date.now());
};

// Add indicator to UI:
{autosaveEnabled && lastAutosaveTime && (
  <div style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
    <CheckCircle size={10} />
    Last saved: {new Date(lastAutosaveTime).toLocaleTimeString()}
  </div>
)}
```

### 2. Add Error Recovery

Handle IndexedDB errors gracefully:

```typescript
const autosaveWorkflow = async (workflowId: string) => {
  if (!workflowId || !autosaveEnabled) return;

  try {
    // ... existing autosave code
  } catch (error) {
    console.error('Autosave failed:', error);

    // Show user-friendly error
    notifications.showToast(
      'Autosave failed. Your changes are still in memory but not saved to disk.',
      'destructive'
    );

    // Optionally disable autosave to prevent repeated errors
    setAutosaveEnabled(false);

    // Offer to retry
    const retry = await notifications.showConfirm(
      'Autosave failed. Would you like to try saving manually?',
      'Save Failed'
    );

    if (retry) {
      setSaveDialogOpen(true);
    }
  }
};
```

### 3. Debounce Autosave Trigger

Prevent excessive autosaves for rapid changes:

```typescript
// Already implemented at lines 96-138 with 2-second debounce ✅
// Consider making delay configurable:

const AUTOSAVE_DELAY = 2000; // 2 seconds

autosaveTimerRef.current = setTimeout(() => {
  console.log('Autosave triggered!');
  lastSavedStateRef.current = currentStateHash;
  autosaveWorkflow(currentWorkflowId);
}, AUTOSAVE_DELAY);
```

---

## Risk Assessment

### Low Risk ✅
- Removing dialog close before confirm (Better UX, no downsides)
- Reading from store instead of props (More reliable)
- Adding debug logging (Helps troubleshooting)
- Adding autosave auto-detection (Improves UX)

### Medium Risk ⚠️
- Adding `key` prop to force re-render (Could cause unnecessary re-mounts)
- Modifying store's loadWorkflow (Should test thoroughly)
- Auto-prompting after import (Could annoy power users)

### Mitigation
- Test all scenarios thoroughly
- Add feature flags for new behaviors
- Provide user preferences/settings
- Add undo/redo support for accidental changes

---

## Success Criteria

After implementing fixes, verify:

- [ ] **No dark screen** when loading workflows
- [ ] **"CURRENT" badge** updates immediately after load
- [ ] **Autosave works** after saving/loading from library
- [ ] **Autosave persists** across page reloads (if implemented)
- [ ] **Import workflow** can be saved to library
- [ ] **Console logs** clearly show workflow ID tracking
- [ ] **All existing tests** still pass
- [ ] **No regressions** in save/export functionality
- [ ] **Performance** is acceptable with autosave enabled

---

## Developer Notes

### Debugging Tips

1. **Check Browser Console**
   - Look for "Loading workflow:", "Autosave triggered!", etc.
   - Verify IDs match between logs

2. **Use React DevTools**
   - Inspect SavedWorkflowsPanel state
   - Check `currentWorkflowId` prop vs `storeWorkflowId`

3. **Check IndexedDB**
   - Open Chrome DevTools > Application > IndexedDB
   - Inspect `ai-workflow-library` > `saved-workflows`
   - Verify workflow IDs match

4. **Check Zustand Store**
   - Add breakpoints in `loadWorkflow` function
   - Verify `metadata.id` is set correctly

### Common Gotchas

1. **Dialog animations**: Radix UI has built-in animations that can cause timing issues
2. **Stale closures**: React hooks can capture old values - use store's `getState()` or refs
3. **IndexedDB async**: All operations are async - use proper error handling
4. **ID generation**: UUIDs are unique - never reuse or modify

---

## Timeline

**Total Estimated Time: 8-12 hours**

- Investigation & Planning: 2 hours (✅ Done)
- Phase 1 (Critical): 2-3 hours
- Phase 2 (Autosave): 3-4 hours
- Phase 3 (Import): 2-3 hours
- Testing: 2-3 hours
- Documentation: 1 hour

**Recommended Approach**: Implement Phase 1 immediately, then Phase 2, then Phase 3 as time permits.

---

## Conclusion

The save/load workflow issues stem from:
1. **Dialog stacking** causing dark screens
2. **State synchronization** issues with workflow IDs
3. **Component-level autosave state** not persisting

The fixes are straightforward and low-risk. The most critical fix (dialog stacking) takes only 15 minutes to implement.

**Next Steps:**
1. Implement Phase 1 fixes (dark screen + ID tracking)
2. Test thoroughly
3. Deploy
4. Monitor user feedback
5. Implement Phase 2 (autosave improvements) in next sprint

---

**Document Version**: 1.0
**Last Updated**: 2025-11-07
**Author**: Claude (Principal Engineer)
**Status**: Ready for Implementation

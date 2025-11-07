# Performance Optimization Guide

## Problem: Input Lag When Typing

### Root Cause

When typing in node input fields, every keystroke triggers:

1. **Store Update** (`updateNode` in `useFlowStore.ts:157-164`)
   ```typescript
   updateNode: (nodeId, data) => {
     set({
       nodes: get().nodes.map((node) =>  // ❌ Recreates entire nodes array
         node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
       ),
     });
     get().updateMetadata({ updatedAt: Date.now() }); // ❌ Updates metadata every keystroke
   },
   ```

2. **IndexedDB Persistence** (via Zustand's `persist` middleware)
   - Every state change triggers serialization and IndexedDB write
   - Heavy overhead for frequent updates

3. **React Re-renders**
   - All components subscribing to the store re-render
   - BaseAINode, node children, dialogs, etc.

### Performance Impact

- **Latency**: 50-200ms delay per keystroke (varies by system)
- **CPU Usage**: Spikes with every keystroke
- **User Experience**: Noticeable lag, choppy typing

## Solution: Debounced Updates

### 1. Use `useDebouncedNodeUpdate` Hook

The `useDebouncedNodeUpdate` hook provides a debounced version of `updateNode`:

```typescript
import { useDebouncedNodeUpdate } from '../hooks/useDebouncedNodeUpdate';

export const MyNode: React.FC<NodeProps> = (props) => {
  const data = props.data as MyNodeData;
  const debouncedUpdate = useDebouncedNodeUpdate(props.id, 300); // 300ms delay

  // Local state for immediate UI updates
  const [localPrompt, setLocalPrompt] = useState(data.prompt || '');

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalPrompt(value); // ✅ Update UI immediately
    debouncedUpdate({ prompt: value }); // ✅ Update store after 300ms
  };

  return (
    <textarea
      value={localPrompt}
      onChange={handlePromptChange}
      className="ai-node-textarea"
    />
  );
};
```

### 2. Sync Local State with Store Updates

When the store is updated externally (e.g., undo/redo, workflow load), sync local state:

```typescript
// Update local state when store value changes
useEffect(() => {
  setLocalPrompt(data.prompt || '');
}, [data.prompt]);
```

### 3. Alternative: Use `useDebounce` Hook

For more control, use the lower-level `useDebounce` hook:

```typescript
import { useDebounce } from '../hooks/useDebounce';

export const MyNode: React.FC<NodeProps> = (props) => {
  const updateNode = useFlowStore((state) => state.updateNode);
  const debouncedUpdate = useDebounce(
    (value: string) => updateNode(props.id, { prompt: value }),
    300
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    debouncedUpdate(e.target.value);
  };

  // Note: This approach doesn't maintain local state
  // May cause cursor jumping if not handled carefully
};
```

## Migration Guide

### Before (Laggy)

```typescript
// AIAgentSettingsDialog.tsx
<textarea
  className="ai-node-input ai-node-textarea"
  value={data.prompt || ''}
  onChange={(e) => onUpdate('prompt', e.target.value)} // ❌ Updates store on every keystroke
  placeholder="Enter your prompt..."
  rows={6}
/>
```

### After (Smooth)

```typescript
// AIAgentSettingsDialog.tsx
const [localPrompt, setLocalPrompt] = useState(data.prompt || '');
const debouncedUpdate = useDebounce(
  (value: string) => onUpdate('prompt', value),
  300
);

useEffect(() => {
  setLocalPrompt(data.prompt || '');
}, [data.prompt]);

const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  setLocalPrompt(value);
  debouncedUpdate(value);
};

<textarea
  className="ai-node-input ai-node-textarea"
  value={localPrompt}
  onChange={handlePromptChange}
  placeholder="Enter your prompt..."
  rows={6}
/>
```

## Performance Metrics

### Before Optimization
- **Input Latency**: 50-200ms
- **CPU Usage**: High spikes on every keystroke
- **Store Updates**: 1 per keystroke (100+ per sentence)
- **IndexedDB Writes**: 1 per keystroke

### After Optimization
- **Input Latency**: <16ms (60fps)
- **CPU Usage**: Minimal during typing, brief spike after pause
- **Store Updates**: 1 per debounce period (1-2 per sentence)
- **IndexedDB Writes**: 1 per debounce period

## Best Practices

### 1. Choose Appropriate Debounce Delay

- **Text inputs**: 300ms (good balance)
- **Sliders/numbers**: 150ms (faster feedback)
- **Large textareas**: 500ms (less frequent updates)

### 2. Always Maintain Local State

```typescript
// ✅ Good: Immediate UI update
const [localValue, setLocalValue] = useState(data.value);
const handleChange = (e) => {
  setLocalValue(e.target.value);
  debouncedUpdate({ value: e.target.value });
};

// ❌ Bad: Cursor jumps, laggy
const handleChange = (e) => {
  debouncedUpdate({ value: e.target.value });
};
```

### 3. Sync with External Updates

```typescript
// Sync local state when store updates externally
useEffect(() => {
  setLocalValue(data.value || '');
}, [data.value]);
```

### 4. Cleanup on Unmount

The hooks handle cleanup automatically, but if implementing manually:

```typescript
useEffect(() => {
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, []);
```

## Components to Optimize

### High Priority (User Types Frequently)

1. ✅ `AIAgentSettingsDialog.tsx`
   - Prompt textarea (line 758)
   - Instructions textarea (line 802)
   - Schema field inputs (lines 1008, 1066)
   - Custom model input (line 347)

2. ✅ `AIAgentNodeV6.tsx`
   - Custom tool inputs (lines 261-263)

3. ✅ `BaseAINode.tsx`
   - Name edit input (line 96)

### Medium Priority (Less Frequent Typing)

4. Schema name/description inputs
5. Numeric inputs (steps, seed, etc.)
6. URL inputs (imageReferenceUrl, etc.)

### Low Priority (Infrequent Changes)

7. Select dropdowns (no debouncing needed)
8. Checkboxes/switches (instant feedback desired)
9. Color pickers (already fast)

## Advanced: Store-Level Optimizations

### Option 1: Batch Updates

```typescript
// Future enhancement: batch multiple field updates
updateNodeBatch: (nodeId, updates) => {
  set({
    nodes: get().nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    ),
  });
  // Single metadata update for all changes
  get().updateMetadata({ updatedAt: Date.now() });
},
```

### Option 2: Selective Persistence

```typescript
// Future enhancement: skip persistence for temporary updates
updateNode: (nodeId, data, skipPersist = false) => {
  // ...update logic
  if (!skipPersist) {
    get().updateMetadata({ updatedAt: Date.now() });
  }
},
```

### Option 3: Immer for Immutable Updates

```typescript
import { produce } from 'immer';

updateNode: (nodeId, data) => {
  set(produce((draft) => {
    const node = draft.nodes.find(n => n.id === nodeId);
    if (node) {
      Object.assign(node.data, data);
    }
  }));
},
```

## Testing Performance

### 1. Chrome DevTools Performance Panel

1. Open DevTools > Performance
2. Start recording
3. Type in an input field
4. Stop recording
5. Look for:
   - Long tasks (>50ms)
   - Frame drops (red bars)
   - CPU usage patterns

### 2. React DevTools Profiler

1. Open React DevTools > Profiler
2. Start recording
3. Type in an input field
4. Stop recording
5. Check:
   - Component render times
   - Render frequency
   - Unnecessary re-renders

### 3. Manual Testing

1. Type quickly in input fields
2. Check for:
   - Cursor jumping
   - Character lag
   - Dropped keystrokes

## Troubleshooting

### Cursor Jumps to End of Input

**Cause**: Component re-rendering with controlled input without local state

**Solution**: Maintain local state for immediate updates

```typescript
const [localValue, setLocalValue] = useState(data.value);
```

### Changes Not Persisting

**Cause**: Debounce delay too long, user navigates away before update

**Solution**:
- Reduce debounce delay
- Flush pending updates on dialog close/navigation

```typescript
const handleDialogClose = () => {
  // Flush pending debounced updates
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    updateNode(nodeId, pendingData);
  }
};
```

### Still Experiencing Lag

**Possible causes**:
1. Other performance issues (too many nodes, complex renders)
2. IndexedDB performance (browser/system dependent)
3. Need to optimize store selectors (reduce subscriptions)

**Solutions**:
- Profile with DevTools to identify bottleneck
- Consider virtualization for large node counts
- Use shallow selectors in useFlowStore

```typescript
// ❌ Bad: Re-renders on any store change
const { nodes, updateNode } = useFlowStore();

// ✅ Good: Only re-renders when specific node changes
const updateNode = useFlowStore((state) => state.updateNode);
const nodeData = useFlowStore((state) =>
  state.nodes.find(n => n.id === nodeId)?.data
);
```

## Summary

The key to eliminating input lag is **debouncing store updates while maintaining local state**:

1. Use `useDebouncedNodeUpdate` hook for easy debouncing
2. Maintain local state for immediate UI feedback
3. Sync local state with store updates
4. Use 300ms debounce delay as default
5. Test on slower systems to ensure smooth typing

This reduces store updates by 90-95% while maintaining a responsive UI.

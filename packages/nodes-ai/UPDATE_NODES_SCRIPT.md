# Batch Update Script for All Node Files

This document provides the systematic updates needed for all node files to implement debounced inputs.

## Pattern to Apply

For each node file with text inputs:

### 1. Add imports
```typescript
import { useState, useEffect } from 'react'; // Add if not present
import { useDebouncedNodeUpdate } from '../hooks/useDebouncedNodeUpdate';
```

### 2. Add debounced update hook
```typescript
const debouncedUpdate = useDebouncedNodeUpdate(props.id, 300);
```

### 3. For each textarea/input that calls `handleChange` or `updateNode`:

**Before:**
```typescript
<textarea
  value={data.prompt || ''}
  onChange={(e) => handleChange('prompt', e.target.value)}
  className="ai-node-textarea"
/>
```

**After:**
```typescript
// Add local state
const [localPrompt, setLocalPrompt] = useState(data.prompt || '');

// Sync with store
useEffect(() => {
  setLocalPrompt(data.prompt || '');
}, [data.prompt]);

// Update textarea
<textarea
  value={localPrompt}
  onChange={(e) => {
    setLocalPrompt(e.target.value);
    debouncedUpdate({ prompt: e.target.value });
  }}
  className="ai-node-textarea nodrag"
/>
```

## Files to Update (Priority Order)

### High Priority (Heavy text input usage)

1. **AIAgentNodeV6.tsx** - Lines 156, 160, 180, 184
   - instructions (textarea)
   - prompt (textarea)
   - temperature (number)
   - maxTokens (number)

2. **TemplateNode.tsx**
   - template (textarea)

3. **ConditionNode.tsx**
   - condition expression (textarea)

4. **WebSearchNode.tsx**
   - query (textarea)

### Medium Priority

5. **ImageGenerationNode.tsx**
   - prompt (textarea)

6. **VideoGenerationNode.tsx**
   - prompt (textarea)

7. **AudioTTSNode.tsx**
   - text (textarea)

8. **DocumentIngestNode.tsx**
   - filePath (input)

9. **WebScrapeNode.tsx**
   - url (input)

10. **HttpRequestNode.tsx**
    - url, body inputs

11. **GenerateNode.tsx**
    - prompt (textarea)

12. **RetrievalQANode.tsx**
    - query (textarea)

13. **GuardrailNode.tsx**
    - rules (textarea)

14. **RerankNode.tsx**
    - query (input)

15. **SplitterNode.tsx**
    - delimiter (input)

16. **AggregatorNode.tsx**
    - expression (textarea)

17. **CacheNode.tsx**
    - key (input)

### Low Priority (Minimal text input)

18. **InputNode.tsx**
19. **OutputNode.tsx**
20. **StartNode.tsx**
21. **StopNode.tsx**
22. **LoopNode.tsx**
23. **MergeNode.tsx**
24. **FileUploadNode.tsx**

## Alternative: Use DebouncedTextarea Component

Instead of manual local state, use the pre-built component:

```typescript
import { DebouncedTextarea } from '../components/DebouncedTextarea';

<DebouncedTextarea
  value={data.prompt || ''}
  onDebouncedChange={(value) => handleChange('prompt', value)}
  className="ai-node-textarea"
  rows={3}
  placeholder="Enter prompt..."
/>
```

## Checklist for Each File

- [ ] Add `useDebouncedNodeUpdate` import
- [ ] Create debounced update hook instance
- [ ] Identify all textarea/input elements
- [ ] Add local state for each text input
- [ ] Add useEffect sync for each local state
- [ ] Update onChange handlers to use local state + debounced update
- [ ] Verify `nodrag` class is present on inputs
- [ ] Test typing performance

## Testing After Updates

1. Open workflow builder
2. Add the updated node type
3. Type quickly in all text inputs
4. Verify:
   - No lag during typing
   - Cursor doesn't jump
   - Values persist after saving
   - Undo/redo works correctly

## Build Verification

```bash
cd /c/Users/Owner/dev/ai-workflows/packages/nodes-ai
pnpm type-check
```

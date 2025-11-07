import { useCallback, useRef, useEffect } from 'react';
import { useFlowStore } from './useFlowStore';

/**
 * Hook that provides debounced node updates to improve typing performance
 *
 * Performance issue:
 * - Every keystroke triggers updateNode() in the store
 * - This causes: full nodes array recreation, metadata updates, IndexedDB writes
 * - Result: lag when typing in input fields
 *
 * Solution:
 * - Debounce the store updates by 300ms (configurable)
 * - UI stays responsive with local state
 * - Store only updates after user stops typing
 *
 * @param nodeId - The ID of the node to update
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced update function
 *
 * @example
 * ```tsx
 * const debouncedUpdate = useDebouncedNodeUpdate(props.id);
 *
 * // In your component
 * const [localPrompt, setLocalPrompt] = useState(data.prompt || '');
 *
 * const handlePromptChange = (e) => {
 *   const value = e.target.value;
 *   setLocalPrompt(value); // Update UI immediately
 *   debouncedUpdate({ prompt: value }); // Update store after debounce
 * };
 * ```
 */
export function useDebouncedNodeUpdate(nodeId: string, delay: number = 300) {
  const updateNode = useFlowStore((state) => state.updateNode);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateRef = useRef(updateNode);

  // Keep ref up to date
  useEffect(() => {
    updateRef.current = updateNode;
  }, [updateNode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (data: Record<string, any>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        updateRef.current(nodeId, data);
      }, delay);
    },
    [nodeId, delay]
  );
}

import React, { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook to debounce a callback function
 * @param callback Function to debounce
 * @param delay Delay in milliseconds (default: 300ms)
 * @returns Debounced version of the callback
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * Hook to create a debounced update handler for controlled inputs
 * Maintains local state for immediate UI updates while debouncing store updates
 *
 * @param initialValue Initial value for the input
 * @param onUpdate Callback to call with the debounced value
 * @param delay Delay in milliseconds (default: 300ms)
 * @returns [localValue, handleChange, setLocalValue]
 */
export function useDebouncedInput<T>(
  initialValue: T,
  onUpdate: (value: T) => void,
  delay: number = 300
): [T, (value: T) => void, React.Dispatch<React.SetStateAction<T>>] {
  const [localValue, setLocalValue] = useState<T>(initialValue);
  const debouncedUpdate = useDebounce(onUpdate, delay);

  // Update local state when initial value changes (e.g., from store)
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  const handleChange = useCallback(
    (value: T) => {
      setLocalValue(value);
      debouncedUpdate(value);
    },
    [debouncedUpdate]
  );

  return [localValue, handleChange, setLocalValue];
}

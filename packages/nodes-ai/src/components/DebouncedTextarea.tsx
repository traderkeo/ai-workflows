import React, { useState, useEffect, useCallback, TextareaHTMLAttributes } from 'react';
import { useDebounce } from '../hooks/useDebounce';

interface DebouncedTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  value: string;
  onDebouncedChange: (value: string) => void;
  debounceDelay?: number;
}

/**
 * Optimized textarea component that debounces updates to prevent lag
 *
 * This component maintains local state for immediate UI updates while debouncing
 * the actual onChange callback to reduce expensive operations (like store updates).
 *
 * @example
 * ```tsx
 * <DebouncedTextarea
 *   value={data.prompt || ''}
 *   onDebouncedChange={(value) => onUpdate('prompt', value)}
 *   placeholder="Enter your prompt..."
 *   className="ai-node-textarea"
 *   rows={6}
 *   debounceDelay={300}
 * />
 * ```
 */
export const DebouncedTextarea: React.FC<DebouncedTextareaProps> = ({
  value,
  onDebouncedChange,
  debounceDelay = 300,
  className,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedUpdate = useDebounce(onDebouncedChange, debounceDelay);

  // Sync local state when external value changes (e.g., undo/redo, load workflow)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue); // Immediate UI update
      debouncedUpdate(newValue); // Debounced callback
    },
    [debouncedUpdate]
  );

  return (
    <textarea
      {...props}
      value={localValue}
      onChange={handleChange}
      className={`${className || ''} nodrag`}
    />
  );
};

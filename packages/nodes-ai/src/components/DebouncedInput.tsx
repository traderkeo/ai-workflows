import React, { useState, useEffect, useCallback, InputHTMLAttributes } from 'react';
import { useDebounce } from '../hooks/useDebounce';

interface DebouncedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string | number;
  onDebouncedChange: (value: string) => void;
  debounceDelay?: number;
}

/**
 * Optimized input component that debounces updates to prevent lag
 *
 * This component maintains local state for immediate UI updates while debouncing
 * the actual onChange callback to reduce expensive operations (like store updates).
 *
 * @example
 * ```tsx
 * <DebouncedInput
 *   value={data.schemaName || ''}
 *   onDebouncedChange={(value) => onUpdate('schemaName', value)}
 *   placeholder="e.g., UserProfile"
 *   className="ai-node-input"
 *   debounceDelay={300}
 * />
 * ```
 */
export const DebouncedInput: React.FC<DebouncedInputProps> = ({
  value,
  onDebouncedChange,
  debounceDelay = 300,
  className,
  type = 'text',
  ...props
}) => {
  const [localValue, setLocalValue] = useState(String(value));
  const debouncedUpdate = useDebounce(onDebouncedChange, debounceDelay);

  // Sync local state when external value changes (e.g., undo/redo, load workflow)
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue); // Immediate UI update
      debouncedUpdate(newValue); // Debounced callback
    },
    [debouncedUpdate]
  );

  return (
    <input
      {...props}
      type={type}
      value={localValue}
      onChange={handleChange}
      className={`${className || ''} nodrag`}
    />
  );
};

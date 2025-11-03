import React from 'react';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, style, onClick, onMouseDown, ...props }, ref) => {
    // For file inputs in React Flow nodes, we need to prevent event propagation
    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      if (type === 'file') {
        e.stopPropagation();
      }
      onClick?.(e);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
      if (type === 'file') {
        e.stopPropagation();
      }
      onMouseDown?.(e);
    };

    return (
      <input
        type={type}
        className={`ai-node-input ${type === 'file' ? 'nopan nodrag' : ''} ${className || ''}`}
        style={style}
        ref={ref}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };


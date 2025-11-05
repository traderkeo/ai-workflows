import React from 'react';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, style, onClick, onMouseDown, ...props }, ref) => {
    // Prevent canvas drag while interacting with inputs
    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      e.stopPropagation();
      onClick?.(e);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
      e.stopPropagation();
      onMouseDown?.(e);
    };

    return (
      <input
        type={type}
        className={`ai-node-input nodrag ${className || ''}`}
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


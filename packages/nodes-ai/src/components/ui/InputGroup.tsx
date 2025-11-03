import React from 'react';

interface InputGroupProps extends React.ComponentProps<'div'> {}

export const InputGroup: React.FC<InputGroupProps> = ({ 
  className = '', 
  style,
  children,
  ...props 
}) => {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={`input-group ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        border: '1px solid var(--cyber-neon-purple)',
        borderRadius: '6px',
        background: 'var(--gothic-black)',
        transition: 'all 0.2s ease',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

interface InputGroupAddonProps extends React.ComponentProps<'div'> {
  align?: 'inline-start' | 'inline-end' | 'block-start' | 'block-end';
}

export const InputGroupAddon: React.FC<InputGroupAddonProps> = ({ 
  className = '', 
  align = 'inline-start',
  style,
  children,
  onClick,
  ...props 
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Focus the input when clicking the addon (unless clicking a button)
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    e.currentTarget.parentElement?.querySelector('input')?.focus();
    onClick?.(e);
  };

  const alignStyles: Record<string, React.CSSProperties> = {
    'inline-start': {
      order: -1,
      paddingLeft: '12px',
      paddingRight: '8px',
    },
    'inline-end': {
      order: 999,
      paddingLeft: '8px',
      paddingRight: '12px',
    },
    'block-start': {
      order: -1,
      width: '100%',
      paddingBottom: '8px',
      paddingTop: '12px',
      paddingLeft: '12px',
      paddingRight: '12px',
    },
    'block-end': {
      order: 999,
      width: '100%',
      paddingTop: '8px',
      paddingBottom: '12px',
      paddingLeft: '12px',
      paddingRight: '12px',
    },
  };

  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={`input-group-addon ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: 'var(--text-muted, #888)',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'text',
        userSelect: 'none',
        ...alignStyles[align],
        ...style,
      }}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
};

interface InputGroupInputProps extends React.ComponentProps<'input'> {}

export const InputGroupInput = React.forwardRef<HTMLInputElement, InputGroupInputProps>(({ 
  className = '', 
  style,
  ...props 
}, ref) => {
  return (
    <input
      ref={ref}
      data-slot="input-group-control"
      className={`ai-node-input input-group-input ${className}`}
      style={{
        flex: 1,
        border: 'none',
        borderRadius: 0,
        background: 'transparent',
        boxShadow: 'none',
        outline: 'none',
        ...style,
      }}
      {...props}
    />
  );
});
InputGroupInput.displayName = 'InputGroupInput';

interface InputGroupTextProps extends React.ComponentProps<'span'> {}

export const InputGroupText: React.FC<InputGroupTextProps> = ({ 
  className = '', 
  style,
  children,
  ...props 
}) => {
  return (
    <span
      className={`input-group-text ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        color: 'var(--text-muted, #888)',
        fontSize: '13px',
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
};


import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`ai-badge ai-badge-${variant} ${className || ''}`}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };

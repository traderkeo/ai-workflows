import React from 'react';
import { Label } from './Label';

interface FieldProps {
  label: string;
  htmlFor?: string;
  helperText?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, htmlFor, helperText, children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Label
        htmlFor={htmlFor}
        style={{
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '0.01em',
          fontFamily: 'inherit',
        }}
      >
        {label}
      </Label>
      {children}
      {helperText && (
        <p
          style={{
            fontSize: '11px',
            fontWeight: 400,
            color: 'var(--text-muted, #888)',
            fontFamily: 'inherit',
            letterSpacing: '0.01em',
            margin: 0,
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

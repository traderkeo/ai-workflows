import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './Collapsible';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={`ai-node-collapsible-section ${className}`}>
      <CollapsibleTrigger asChild>
        <button
          className="ai-node-section-trigger"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(176, 38, 255, 0.2)',
            borderRadius: '4px',
            color: 'var(--text-primary, #e5e5e5)',
            fontFamily: 'var(--font-geist-sans, "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif)',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.01em',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.4)';
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.2)';
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.15)';
          }}
        >
          {isOpen ? (
            <ChevronDown size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
          ) : (
            <ChevronRight size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
          )}
          {icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>}
          <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent
        style={{
          paddingTop: '8px',
          paddingLeft: '4px',
          paddingRight: '4px',
        }}
      >
        <div className="ai-node-section-content">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};


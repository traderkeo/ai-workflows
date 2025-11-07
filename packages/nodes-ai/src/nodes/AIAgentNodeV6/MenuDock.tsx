import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MenuDockProps {
  items: Array<{
    id: string;
    label: string;
    icon: LucideIcon;
  }>;
  activeItem: string;
  onItemChange: (id: string) => void;
}

export const MenuDock: React.FC<MenuDockProps> = ({ items, activeItem, onItemChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '8px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        border: '1px solid rgba(176, 38, 255, 0.2)',
        minWidth: '60px',
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onItemChange(item.id)}
            title={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '10px 8px',
              background: isActive ? 'rgba(176, 38, 255, 0.2)' : 'transparent',
              border: isActive ? '1px solid rgba(176, 38, 255, 0.5)' : '1px solid transparent',
              borderRadius: '6px',
              color: isActive ? 'var(--cyber-neon-purple, #b026ff)' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(176, 38, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.3)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
              }
            }}
          >
            <Icon size={18} />
            <span style={{ fontSize: '9px', whiteSpace: 'nowrap' }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import { FileJson, Download, Upload, Grid3x3, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface FileActionsMenuProps {
  onExport: () => void;
  onImport: () => void;
  onAutoLayout: () => void;
  onReset: () => void;
}

export const FileActionsMenu: React.FC<FileActionsMenuProps> = ({
  onExport,
  onImport,
  onAutoLayout,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = () => setIsOpen(false);
    setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);

  const handleAction = useCallback((action: () => void) => {
    action();
    setIsOpen(false);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        variant="outline"
        size="sm"
        className="h-9 px-4 font-medium"
        title="File actions"
      >
        <FileJson size={16} strokeWidth={2} />
        <span>File</span>
      </Button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '4px',
            zIndex: 50,
            background: 'linear-gradient(135deg, var(--gothic-charcoal) 0%, var(--gothic-slate) 100%)',
            border: 'var(--border-glow) solid var(--cyber-neon-purple)',
            borderRadius: '8px',
            boxShadow: 'var(--node-shadow)',
            minWidth: '180px',
            overflow: 'hidden',
            fontFamily: 'var(--font-primary)',
          }}
        >
          <MenuButton
            icon={<Download size={14} />}
            label="Export JSON"
            onClick={() => handleAction(onExport)}
          />
          <MenuButton
            icon={<Upload size={14} />}
            label="Import JSON"
            onClick={() => handleAction(onImport)}
            withBorder
          />
          <MenuButton
            icon={<Grid3x3 size={14} />}
            label="Auto Arrange"
            onClick={() => handleAction(onAutoLayout)}
            withBorder
          />
          <MenuButton
            icon={<Trash2 size={14} />}
            label="Reset Workflow"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              // Use onMouseDown instead of onClick to prevent conflicts
              setTimeout(() => onReset(), 0);
            }}
            withBorder
            danger
          />
        </div>
      )}
    </div>
  );
};

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  withBorder?: boolean;
  danger?: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, label, onClick, withBorder, danger }) => {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        fontSize: '13px',
        background: 'transparent',
        border: 'none',
        borderTop: withBorder ? '1px solid rgba(176, 38, 255, 0.3)' : 'none',
        color: danger ? '#ff0040' : 'var(--cyber-neon-cyan)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? 'rgba(255, 0, 64, 0.1)'
          : 'rgba(176, 38, 255, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {icon}
      {label}
    </button>
  );
};

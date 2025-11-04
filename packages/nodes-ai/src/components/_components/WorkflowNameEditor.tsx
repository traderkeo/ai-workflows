import React, { useCallback, useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface WorkflowNameEditorProps {
  name: string;
  onSave: (newName: string) => void;
}

export const WorkflowNameEditor: React.FC<WorkflowNameEditorProps> = ({ name, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(name);

  // Update editing name when prop changes
  React.useEffect(() => {
    if (!isEditing) {
      setEditingName(name);
    }
  }, [name, isEditing]);

  const handleSave = useCallback(() => {
    if (editingName.trim()) {
      onSave(editingName.trim());
    }
    setIsEditing(false);
  }, [editingName, onSave]);

  const handleCancel = useCallback(() => {
    setEditingName(name);
    setIsEditing(false);
  }, [name]);

  if (isEditing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Input
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          style={{
            width: '240px',
            padding: '8px 12px',
            fontSize: '14px',
            fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--cyber-neon-cyan)',
            borderRadius: '6px',
            color: 'var(--cyber-neon-cyan)',
            outline: 'none',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            height: '36px',
          }}
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          style={{ 
            padding: '6px', 
            minWidth: 'auto', 
            color: 'var(--status-success)',
            height: '36px',
            width: '36px',
          }}
          title="Save"
        >
          <Check size={16} strokeWidth={2.5} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          style={{ 
            padding: '6px', 
            minWidth: 'auto', 
            color: '#ff0040',
            height: '36px',
            width: '36px',
          }}
          title="Cancel"
        >
          <X size={16} strokeWidth={2.5} />
        </Button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        padding: '6px 12px',
        borderRadius: '6px',
        transition: 'all 0.15s ease',
        height: '36px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(176, 38, 255, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
      title="Click to edit name"
    >
      <span style={{
        fontSize: '15px',
        fontWeight: 600,
        color: 'var(--cyber-neon-cyan)',
        fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
        letterSpacing: '-0.02em',
        textShadow: '0 0 8px rgba(0, 240, 255, 0.3)',
      }}>
        {name}
      </span>
      <Edit2 size={14} strokeWidth={2} style={{ color: 'var(--cyber-neon-cyan)', opacity: 0.5 }} />
    </div>
  );
};

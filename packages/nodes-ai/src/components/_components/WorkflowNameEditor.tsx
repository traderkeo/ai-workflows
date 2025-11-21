import React, { useCallback, useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';

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
      <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
        {/* Input Field */}
        <input
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
            background: 'rgba(24, 24, 27, 0.8)',
            border: 'none',
            borderBottom: '1px solid rgba(0, 240, 255, 0.5)',
            borderLeft: '1px solid rgba(0, 240, 255, 0.5)',
            borderRadius: '6px 0 0 6px',
            color: 'rgb(228, 228, 231)',
            outline: 'none',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            height: '100%',
            minWidth: '120px',
            boxShadow: '0 0 4px rgba(0, 240, 255, 0.2)',
          }}
          autoFocus
        />
        {/* Action Buttons Container - Dark Purple Background */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(88, 28, 135, 0.6)',
          borderRadius: '0 6px 6px 0',
          height: '100%',
          padding: '0 4px',
          gap: '2px',
        }}>
          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              height: '24px',
              width: '24px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Save"
          >
            <Check size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={handleCancel}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: '#ef4444',
              cursor: 'pointer',
              height: '24px',
              width: '24px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Cancel"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        padding: '6px 12px',
        borderRadius: '6px',
        transition: 'all 0.15s ease',
        height: '32px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(161, 161, 170, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
      title="Click to edit name"
    >
      <span style={{
        fontSize: '14px',
        fontWeight: 500,
        color: 'rgb(228, 228, 231)',
        fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
        letterSpacing: '-0.01em',
      }}>
        {name}
      </span>
      <Edit2 size={12} strokeWidth={2} style={{ color: 'rgb(161, 161, 170)', opacity: 0.6 }} />
    </div>
  );
};

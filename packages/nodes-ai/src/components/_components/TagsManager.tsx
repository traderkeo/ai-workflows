import React, { useCallback, useState } from 'react';
import { Tag, X, Plus } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface TagsManagerProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export const TagsManager: React.FC<TagsManagerProps> = ({ tags, onAddTag, onRemoveTag }) => {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');

  const handleAddTag = useCallback(() => {
    const tag = newTagValue.trim();
    if (tag && !tags.includes(tag)) {
      onAddTag(tag);
      setNewTagValue('');
      setIsAddingTag(false);
    }
  }, [newTagValue, tags, onAddTag]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', height: '36px' }}>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            fontSize: '12px',
            fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
            fontWeight: 500,
            background: 'var(--tag-bg, rgba(176, 38, 255, 0.15))',
            color: 'var(--tag-text, var(--cyber-neon-purple))',
            border: '1px solid var(--tag-border, rgba(176, 38, 255, 0.3))',
            borderRadius: '6px',
            height: '28px',
            letterSpacing: '-0.01em',
          }}
        >
          <Tag size={12} strokeWidth={2} />
          {tag}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveTag(tag);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '2px',
              display: 'flex',
              alignItems: 'center',
              opacity: 0.6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6';
            }}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </Badge>
      ))}

      {isAddingTag ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Input
            value={newTagValue}
            onChange={(e) => setNewTagValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddTag();
              } else if (e.key === 'Escape') {
                setIsAddingTag(false);
                setNewTagValue('');
              }
            }}
            placeholder="Tag name..."
            style={{
              width: '140px',
              padding: '6px 10px',
              fontSize: '12px',
              fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
              fontWeight: 500,
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--tag-border, var(--cyber-neon-purple))',
              borderRadius: '6px',
              color: 'var(--context-menu-text, var(--cyber-neon-cyan))',
              outline: 'none',
              height: '28px',
              letterSpacing: '-0.01em',
            }}
            autoFocus
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsAddingTag(false);
              setNewTagValue('');
            }}
            style={{ padding: '6px', minWidth: 'auto', height: '28px', width: '28px' }}
          >
            <X size={12} strokeWidth={2.5} />
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingTag(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            fontSize: '12px',
            fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
            fontWeight: 500,
            background: 'var(--tag-bg, rgba(176, 38, 255, 0.08))',
            border: '1px dashed var(--tag-border, rgba(176, 38, 255, 0.3))',
            borderRadius: '6px',
            color: 'var(--tag-text, var(--cyber-neon-purple))',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            height: '28px',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={(e) => {
            const theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'monochrome') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.borderColor = 'var(--mono-light-gray)';
            } else {
              e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            const theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'monochrome') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'var(--mono-mid-gray)';
            } else {
              e.currentTarget.style.background = 'rgba(176, 38, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.3)';
            }
          }}
        >
          <Plus size={12} strokeWidth={2.5} />
          Add Tag
        </button>
      )}
    </div>
  );
};

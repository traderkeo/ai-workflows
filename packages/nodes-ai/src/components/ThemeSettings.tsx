import React from 'react';
import { Palette } from 'lucide-react';
import { useTheme, type Theme } from '../context/ThemeContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/Select';

export const ThemeSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes: { value: Theme; label: string; description: string }[] = [
    {
      value: 'cyber-punk',
      label: 'Cyber Punk',
      description: 'Neon cyberpunk with gothic vibes',
    },
    {
      value: 'dark-home',
      label: 'Dark Home',
      description: 'Vercel dark mixed with castle aesthetics',
    },
  ];

  return (
    <Select value={theme} onValueChange={(value) => setTheme(value as Theme)}>
      <SelectTrigger
        className="h-9 px-4 gap-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
        style={{
          fontFamily: 'var(--font-geist-sans, "Geist", "Inter", sans-serif)',
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '-0.01em',
        }}
      >
        <Palette size={16} strokeWidth={2} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {themes.map((t) => (
          <SelectItem key={t.value} value={t.value}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontWeight: 500 }}>{t.label}</span>
              <span style={{ fontSize: '11px', opacity: 0.6 }}>{t.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

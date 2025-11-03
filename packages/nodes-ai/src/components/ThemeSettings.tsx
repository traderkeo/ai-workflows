import React from 'react';
import { Palette } from 'lucide-react';
import { useTheme, type Theme } from '../context/ThemeContext';

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
    <div className="relative">
     
      <button
        className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-8 px-3 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
        title={themes.find((t) => t.value === theme)?.description}
      >
        <Palette size={14} />
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
          className="bg-transparent border-none outline-none cursor-pointer text-xs font-medium appearance-none pr-6"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.25rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1rem',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {themes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </button>
    </div>
  );
};

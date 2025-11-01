'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

export type ModelId = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo';

export interface ModelOption {
  id: ModelId;
  name: string;
  description: string;
  badge?: string;
}

const models: ModelOption[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4 Omni',
    description: 'Most capable with vision',
    badge: 'Premium',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4 Omni Mini',
    description: 'Fast and efficient',
    badge: 'Default',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Previous generation',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fastest and cheapest',
    badge: 'Budget',
  },
];

interface ModelSelectorProps {
  value: ModelId;
  onChange: (model: ModelId) => void;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

export function ModelSelector({
  value,
  onChange,
  label = 'Model',
  showLabel = true,
  className = '',
}: ModelSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <Label className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </div>
                {model.badge && (
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {model.badge}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { models as AVAILABLE_MODELS };

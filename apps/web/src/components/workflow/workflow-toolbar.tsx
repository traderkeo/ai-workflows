import { Button } from '@/components/ui/button';
import { Play, Save, Upload, Trash2, Download, Settings, Zap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WorkflowToolbarProps {
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
  onExecute: () => void;
}

export function WorkflowToolbar({ onSave, onLoad, onClear, onExecute }: WorkflowToolbarProps) {
  return (
    <div className="flex items-center gap-2 bg-zinc-900/95 border border-zinc-800 rounded-lg px-3 py-2 shadow-lg backdrop-blur-sm">
      {/* Execute Button - Primary Action */}
      <Button
        onClick={onExecute}
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white border-0"
      >
        <Play className="h-4 w-4 mr-2" />
        Execute
      </Button>

      <div className="w-px h-6 bg-zinc-800" />

      {/* Save Button */}
      <Button
        onClick={onSave}
        variant="ghost"
        size="sm"
        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
      >
        <Save className="h-4 w-4 mr-2" />
        Save
      </Button>

      {/* Load Button */}
      <Button
        onClick={onLoad}
        variant="ghost"
        size="sm"
        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
      >
        <Upload className="h-4 w-4 mr-2" />
        Load
      </Button>

      <div className="w-px h-6 bg-zinc-800" />

      {/* More Options Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <Settings className="h-4 w-4 mr-2" />
            More
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-zinc-900 border-zinc-800 w-48"
        >
          <DropdownMenuItem
            onClick={onClear}
            className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Canvas
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </DropdownMenuItem>
          <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Import JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer">
            <Zap className="h-4 w-4 mr-2" />
            Test Workflow
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Workflow Status Indicator */}
      <div className="flex items-center gap-2 ml-2 pl-2 border-l border-zinc-800">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-zinc-500">Ready</span>
        </div>
      </div>
    </div>
  );
}

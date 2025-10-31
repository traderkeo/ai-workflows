'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TextNodeData } from '../types';

interface EditTextNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeData: TextNodeData | null;
  onSave: (data: TextNodeData) => void;
}

export function EditTextNodeDialog({
  open,
  onOpenChange,
  nodeData,
  onSave,
}: EditTextNodeDialogProps) {
  const [formData, setFormData] = useState<Partial<TextNodeData>>({
    label: '',
    description: '',
    input: '',
    output: '',
    status: 'idle',
  });

  useEffect(() => {
    if (nodeData) {
      setFormData({
        label: nodeData.label,
        description: nodeData.description,
        input: nodeData.input || '',
        output: nodeData.output || '',
        status: nodeData.status || 'idle',
      });
    }
  }, [nodeData, open]); // Re-sync when dialog opens or nodeData changes

  const handleSave = () => {
    if (!nodeData) return;
    
    const updatedData: TextNodeData = {
      ...nodeData,
      label: formData.label || nodeData.label,
      description: formData.description || nodeData.description,
      input: formData.input,
      output: formData.output,
      status: formData.status || 'idle',
    };
    
    onSave(updatedData);
    onOpenChange(false);
  };

  if (!nodeData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Text Node</DialogTitle>
          <DialogDescription>
            Configure the text generation node settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Label</label>
            <Input
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              placeholder="Node label"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Node description"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Input Text</label>
            <Textarea
              value={formData.input}
              onChange={(e) =>
                setFormData({ ...formData, input: e.target.value })
              }
              placeholder="Input text to process..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Output Text</label>
            <Textarea
              value={formData.output}
              onChange={(e) =>
                setFormData({ ...formData, output: e.target.value })
              }
              placeholder="Generated output text..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={formData.status}
              onValueChange={(value: TextNodeData['status']) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

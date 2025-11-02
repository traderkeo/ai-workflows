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
import type { StopNodeData } from '../types';

interface EditStopNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeData: StopNodeData | null;
  onSave: (data: StopNodeData) => void;
}

export function EditStopNodeDialog({
  open,
  onOpenChange,
  nodeData,
  onSave,
}: EditStopNodeDialogProps) {
  const [formData, setFormData] = useState<Partial<StopNodeData>>({
    label: '',
    description: '',
    reason: '',
    status: 'idle',
  });

  useEffect(() => {
    if (nodeData) {
      setFormData({
        label: nodeData.label,
        description: nodeData.description,
        reason: nodeData.reason || '',
        status: nodeData.status || 'idle',
      });
    }
  }, [nodeData, open]); // Re-sync when dialog opens or nodeData changes

  const handleSave = () => {
    if (!nodeData) return;
    
    const updatedData: StopNodeData = {
      ...nodeData,
      label: formData.label || nodeData.label,
      description: formData.description || nodeData.description,
      reason: formData.reason,
      status: formData.status || 'idle',
    };
    
    onSave(updatedData);
    onOpenChange(false);
  };

  if (!nodeData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Stop Node</DialogTitle>
          <DialogDescription>
            Configure the stop node settings
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
            <label className="text-sm font-medium">Stop Reason</label>
            <Textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="Reason for stopping the workflow..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as StopNodeData['status'] })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
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

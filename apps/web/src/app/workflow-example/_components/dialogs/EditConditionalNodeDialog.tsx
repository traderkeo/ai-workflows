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
import { Badge } from '@/components/ui/badge';
import type { ConditionalNodeData } from '../types';

interface EditConditionalNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeData: ConditionalNodeData | null;
  onSave: (data: ConditionalNodeData) => void;
}

export function EditConditionalNodeDialog({
  open,
  onOpenChange,
  nodeData,
  onSave,
}: EditConditionalNodeDialogProps) {
  const [formData, setFormData] = useState<Partial<ConditionalNodeData>>({
    label: '',
    description: '',
    condition: '',
    branches: [],
  });
  const [branchInputs, setBranchInputs] = useState<
    Array<{ id: string; label: string; condition: string }>
  >([]);

  useEffect(() => {
    if (nodeData) {
      setFormData({
        label: nodeData.label,
        description: nodeData.description,
        condition: nodeData.condition || '',
        branches: nodeData.branches || [],
      });
      setBranchInputs(
        nodeData.branches || [
          { id: 'if', label: 'If', condition: 'true' },
          { id: 'else', label: 'Else', condition: 'false' },
        ]
      );
    }
  }, [nodeData, open]); // Re-sync when dialog opens or nodeData changes

  const handleAddBranch = () => {
    const newId = `branch-${Date.now()}`;
    setBranchInputs([
      ...branchInputs,
      { id: newId, label: `Branch ${branchInputs.length + 1}`, condition: '' },
    ]);
  };

  const handleRemoveBranch = (id: string) => {
    if (branchInputs.length <= 1) return;
    setBranchInputs(branchInputs.filter((b) => b.id !== id));
  };

  const handleUpdateBranch = (
    id: string,
    field: 'label' | 'condition',
    value: string
  ) => {
    setBranchInputs(
      branchInputs.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const handleSave = () => {
    if (!nodeData) return;
    
    const updatedData: ConditionalNodeData = {
      ...nodeData,
      label: formData.label || nodeData.label,
      description: formData.description || nodeData.description,
      condition: formData.condition,
      branches: branchInputs,
    };
    
    onSave(updatedData);
    onOpenChange(false);
  };

  if (!nodeData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Conditional Node</DialogTitle>
          <DialogDescription>
            Configure the conditional branching node settings
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
            <label className="text-sm font-medium">Main Condition</label>
            <Textarea
              value={formData.condition}
              onChange={(e) =>
                setFormData({ ...formData, condition: e.target.value })
              }
              placeholder="data.status === 'valid' && data.score > 0.8"
              rows={2}
              className="font-mono text-sm"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Branches</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddBranch}
              >
                + Add Branch
              </Button>
            </div>
            
            <div className="space-y-2">
              {branchInputs.map((branch, index) => (
                <div
                  key={branch.id}
                  className="flex gap-2 items-start p-3 border rounded-md"
                >
                  <div className="flex-1 space-y-2">
                    <Input
                      value={branch.label}
                      onChange={(e) =>
                        handleUpdateBranch(branch.id, 'label', e.target.value)
                      }
                      placeholder="Branch label"
                      className="text-sm"
                    />
                    <Textarea
                      value={branch.condition}
                      onChange={(e) =>
                        handleUpdateBranch(
                          branch.id,
                          'condition',
                          e.target.value
                        )
                      }
                      placeholder="Branch condition"
                      rows={1}
                      className="font-mono text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBranch(branch.id)}
                    disabled={branchInputs.length <= 1}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
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

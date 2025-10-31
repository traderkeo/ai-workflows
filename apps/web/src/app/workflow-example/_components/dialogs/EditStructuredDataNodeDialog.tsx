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
import type { StructuredDataNodeData } from '../types';

interface EditStructuredDataNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeData: StructuredDataNodeData | null;
  onSave: (data: StructuredDataNodeData) => void;
}

export function EditStructuredDataNodeDialog({
  open,
  onOpenChange,
  nodeData,
  onSave,
}: EditStructuredDataNodeDialogProps) {
  const [formData, setFormData] = useState<Partial<StructuredDataNodeData>>({
    label: '',
    description: '',
    input: '',
    schema: {},
    output: {},
    status: 'idle',
  });
  const [schemaText, setSchemaText] = useState('');
  const [outputText, setOutputText] = useState('');

  useEffect(() => {
    if (nodeData) {
      setFormData({
        label: nodeData.label,
        description: nodeData.description,
        input: nodeData.input || '',
        schema: nodeData.schema || {},
        output: nodeData.output || {},
        status: nodeData.status || 'idle',
      });
      setSchemaText(
        nodeData.schema ? JSON.stringify(nodeData.schema, null, 2) : ''
      );
      setOutputText(
        nodeData.output ? JSON.stringify(nodeData.output, null, 2) : ''
      );
    }
  }, [nodeData, open]); // Re-sync when dialog opens or nodeData changes

  const handleSave = () => {
    if (!nodeData) return;
    
    try {
      const parsedSchema = schemaText ? JSON.parse(schemaText) : {};
      const parsedOutput = outputText ? JSON.parse(outputText) : {};
      
      const updatedData: StructuredDataNodeData = {
        ...nodeData,
        label: formData.label ?? nodeData.label,
        description: formData.description ?? nodeData.description,
        input: formData.input,
        schema: parsedSchema,
        output: parsedOutput,
        status: formData.status ?? nodeData.status ?? 'idle',
      };
      
      onSave(updatedData);
      onOpenChange(false);
    } catch (error) {
      alert('Invalid JSON in schema or output fields');
    }
  };

  if (!nodeData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Structured Data Node</DialogTitle>
          <DialogDescription>
            Configure the structured data extraction node settings
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
              placeholder="Input text to extract data from..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Schema (JSON)</label>
            <Textarea
              value={schemaText}
              onChange={(e) => setSchemaText(e.target.value)}
              placeholder='{"name": "string", "age": "number"}'
              rows={4}
              className="font-mono text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Output (JSON)</label>
            <Textarea
              value={outputText}
              onChange={(e) => setOutputText(e.target.value)}
              placeholder='{"name": "John", "age": 30}'
              rows={4}
              className="font-mono text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as StructuredDataNodeData['status'] })
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

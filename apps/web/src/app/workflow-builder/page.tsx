'use client';

import * as React from 'react';
import { WorkflowBuilder, NotificationProvider } from '@repo/nodes-ai';
import '@repo/nodes-ai/styles';
import './workflow-builder.css';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Label } from '@/components/ui/label';

function useAlertDialog() {
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertConfig, setAlertConfig] = React.useState<{ message: string; title?: string } | null>(null);
  const alertResolveRef = React.useRef<(() => void) | null>(null);

  const showAlert = React.useCallback((message: string, title?: string): Promise<void> => {
    return new Promise((resolve) => {
      setAlertConfig({ message, title });
      setAlertOpen(true);
      alertResolveRef.current = resolve;
    });
  }, []);

  const handleAlertClose = React.useCallback(() => {
    setAlertOpen(false);
    if (alertResolveRef.current) {
      alertResolveRef.current();
      alertResolveRef.current = null;
    }
  }, []);

  return { showAlert, alertOpen, alertConfig, handleAlertClose };
}

function useConfirmDialog() {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmConfig, setConfirmConfig] = React.useState<{ message: string; title?: string } | null>(null);
  const confirmResolveRef = React.useRef<((value: boolean) => void) | null>(null);

  const showConfirm = React.useCallback((message: string, title?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmConfig({ message, title });
      setConfirmOpen(true);
      confirmResolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = React.useCallback((value: boolean) => {
    setConfirmOpen(false);
    if (confirmResolveRef.current) {
      confirmResolveRef.current(value);
      confirmResolveRef.current = null;
    }
  }, []);

  return { showConfirm, confirmOpen, confirmConfig, handleConfirm };
}

function usePromptDialog() {
  const [promptOpen, setPromptOpen] = React.useState(false);
  const [promptConfig, setPromptConfig] = React.useState<{ message: string; defaultValue?: string } | null>(null);
  const [promptValue, setPromptValue] = React.useState('');
  const promptResolveRef = React.useRef<((value: string | null) => void) | null>(null);

  const showPrompt = React.useCallback((message: string, defaultValue?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptConfig({ message, defaultValue });
      setPromptValue(defaultValue || '');
      setPromptOpen(true);
      promptResolveRef.current = resolve;
    });
  }, []);

  const handlePromptSubmit = React.useCallback(() => {
    setPromptOpen(false);
    if (promptResolveRef.current) {
      promptResolveRef.current(promptValue.trim() || null);
      promptResolveRef.current = null;
    }
    setPromptValue('');
  }, [promptValue]);

  const handlePromptCancel = React.useCallback(() => {
    setPromptOpen(false);
    if (promptResolveRef.current) {
      promptResolveRef.current(null);
      promptResolveRef.current = null;
    }
    setPromptValue('');
  }, []);

  return { showPrompt, promptOpen, promptConfig, promptValue, setPromptValue, handlePromptSubmit, handlePromptCancel };
}

export default function WorkflowBuilderPage() {
  const alertDialog = useAlertDialog();
  const confirmDialog = useConfirmDialog();
  const promptDialog = usePromptDialog();

  const notificationValue = React.useMemo(() => ({
    showAlert: alertDialog.showAlert,
    showConfirm: confirmDialog.showConfirm,
    showPrompt: promptDialog.showPrompt,
    showToast: (message: string, variant: 'default' | 'destructive' | 'success' = 'default') => {
      toast({
        title: variant === 'success' ? 'Success' : variant === 'destructive' ? 'Error' : 'Info',
        description: message,
        variant: variant === 'destructive' ? 'destructive' : 'default',
      });
    },
  }), [alertDialog.showAlert, confirmDialog.showConfirm, promptDialog.showPrompt]);

  return (
    <>
      <NotificationProvider value={notificationValue}>
        <div className="w-screen h-screen bg-zinc-950 overflow-hidden">
          <WorkflowBuilder />
        </div>
      </NotificationProvider>
      
      {/* Alert Dialog */}
      <AlertDialog open={alertDialog.alertOpen} onOpenChange={(open) => !open && alertDialog.handleAlertClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {alertDialog.alertConfig?.title && (
              <AlertDialogTitle>{alertDialog.alertConfig.title}</AlertDialogTitle>
            )}
            <AlertDialogDescription>{alertDialog.alertConfig?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={alertDialog.handleAlertClose}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.confirmOpen} onOpenChange={(open) => !open && confirmDialog.handleConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {confirmDialog.confirmConfig?.title && (
              <AlertDialogTitle>{confirmDialog.confirmConfig.title}</AlertDialogTitle>
            )}
            <AlertDialogDescription>{confirmDialog.confirmConfig?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => confirmDialog.handleConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDialog.handleConfirm(true)}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Prompt Dialog */}
      <Dialog open={promptDialog.promptOpen} onOpenChange={(open) => !open && promptDialog.handlePromptCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Value</DialogTitle>
            <DialogDescription>{promptDialog.promptConfig?.message}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="prompt-input">Value</Label>
            <Input
              id="prompt-input"
              value={promptDialog.promptValue}
              onChange={(e) => promptDialog.setPromptValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  promptDialog.handlePromptSubmit();
                } else if (e.key === 'Escape') {
                  promptDialog.handlePromptCancel();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={promptDialog.handlePromptCancel}>Cancel</Button>
            <Button onClick={promptDialog.handlePromptSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </>
  );
}

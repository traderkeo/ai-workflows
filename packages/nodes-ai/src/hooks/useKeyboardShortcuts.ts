import { useEffect } from 'react';
import { useFlowStore } from './useFlowStore';

interface UseKeyboardShortcutsProps {
  onExecute?: () => void;
  onSave?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onExecute,
  onSave,
  enabled = true,
}: UseKeyboardShortcutsProps = {}) => {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelectedNodes,
    duplicateSelectedNodes,
    selectAllNodes,
  } = useFlowStore();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Undo: Ctrl/Cmd + Z
      if (cmdOrCtrl && event.key === 'z' && !event.shiftKey && canUndo()) {
        event.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if (
        (cmdOrCtrl && event.key === 'y') ||
        (cmdOrCtrl && event.shiftKey && event.key === 'z')
      ) {
        if (canRedo()) {
          event.preventDefault();
          redo();
        }
        return;
      }

      // Delete: Delete or Backspace
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelectedNodes();
        return;
      }

      // Duplicate: Ctrl/Cmd + D
      if (cmdOrCtrl && event.key === 'd') {
        event.preventDefault();
        duplicateSelectedNodes();
        return;
      }

      // Select All: Ctrl/Cmd + A
      if (cmdOrCtrl && event.key === 'a') {
        event.preventDefault();
        selectAllNodes();
        return;
      }

      // Save: Ctrl/Cmd + S
      if (cmdOrCtrl && event.key === 's') {
        event.preventDefault();
        onSave?.();
        return;
      }

      // Execute: Ctrl/Cmd + E or Ctrl/Cmd + Enter
      if (cmdOrCtrl && (event.key === 'e' || event.key === 'Enter')) {
        event.preventDefault();
        onExecute?.();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelectedNodes,
    duplicateSelectedNodes,
    selectAllNodes,
    onExecute,
    onSave,
  ]);
};

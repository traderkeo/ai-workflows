import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { ContextMenu } from './ContextMenu';
import { CommandPalette } from './CommandPalette';
import { NodePalette } from './NodePalette';
import { NodeConfigPanel } from './NodeConfigPanel';

const WorkflowBuilderInner: React.FC = () => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const { getViewport } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu) {
        handleCloseContextMenu();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu, handleCloseContextMenu]);

  // Command palette keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }

      // Also support '/' key to open command palette
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen bg-zinc-950">
      {/* Node Palette - Left Sidebar */}
      <NodePalette />

      {/* Main Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative"
        onContextMenu={handleContextMenu}
      >
        <WorkflowCanvas />

        {contextMenu && (
          <ContextMenu
            position={contextMenu}
            onClose={handleCloseContextMenu}
            canvasPosition={getViewport()}
            zoom={getViewport().zoom}
          />
        )}

        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />
      </div>

      {/* Configuration Panel - Right Sidebar */}
      <NodeConfigPanel />
    </div>
  );
};

export const WorkflowBuilder: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner />
    </ReactFlowProvider>
  );
};

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { ContextMenu } from './ContextMenu';

const WorkflowBuilderInner: React.FC = () => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

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

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
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

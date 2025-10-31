import { Background, ReactFlow, type ReactFlowProps } from "@xyflow/react";
import type { ReactNode } from "react";
import "@xyflow/react/dist/style.css";
import { Controls } from "./controls";

type CanvasProps = ReactFlowProps & {
  children?: ReactNode;
};

export const Canvas = ({ children, ...props }: CanvasProps) => (
  <ReactFlow
    deleteKeyCode={["Backspace", "Delete"]}
    fitView
    panOnDrag={[1, 2]}
    panOnScroll
    selectionOnDrag={true}
    zoomOnDoubleClick={false}
    nodesDraggable={true}
    nodesConnectable={true}
    elementsSelectable={true}
    // Performance optimizations for smooth edge rendering during node drag
    onlyRenderVisibleElements={false}
    selectNodesOnDrag={false}
    // Ensure edges update in real-time during node drag
    snapToGrid={false}
    {...props}
  >
    <Background bgColor="var(--sidebar)" />
    <Controls />
    {children}
  </ReactFlow>
);

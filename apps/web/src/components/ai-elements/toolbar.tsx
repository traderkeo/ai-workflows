import { cn } from "@/lib/utils";
import { NodeToolbar, Position } from "@xyflow/react";
import type { ComponentProps } from "react";

type ToolbarProps = ComponentProps<typeof NodeToolbar> & {
  isVisible?: boolean;
};

export const Toolbar = ({ className, position, isVisible = true, ...props }: ToolbarProps) => {
  if (!isVisible) {
    return null;
  }

  return (
    <NodeToolbar
      className={cn(
        "flex items-center gap-1 rounded-sm border bg-background p-1.5",
        className
      )}
      position={position ?? Position.Bottom}
      {...props}
    />
  );
};

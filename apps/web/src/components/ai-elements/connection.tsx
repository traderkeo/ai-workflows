import type { ConnectionLineComponent } from "@xyflow/react";

const HALF = 0.5;

export const Connection: ConnectionLineComponent = ({
  fromX,
  fromY,
  toX,
  toY,
}: any) => {
  // Calculate arrow direction
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const arrowLength = 10;
  const arrowAngle = Math.PI / 6; // 30 degrees
  
  // Arrow points
  const arrowX = toX - Math.cos(angle) * arrowLength;
  const arrowY = toY - Math.sin(angle) * arrowLength;
  const arrowX1 = arrowX - Math.cos(angle + arrowAngle) * 8;
  const arrowY1 = arrowY - Math.sin(angle + arrowAngle) * 8;
  const arrowX2 = arrowX - Math.cos(angle - arrowAngle) * 8;
  const arrowY2 = arrowY - Math.sin(angle - arrowAngle) * 8;
  
  return (
    <g>
      <path
        className="animated"
        d={`M${fromX},${fromY} C ${fromX + (toX - fromX) * HALF},${fromY} ${fromX + (toX - fromX) * HALF},${toY} ${toX},${toY}`}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={2.5}
        strokeDasharray="6,4"
        opacity={0.7}
        style={{
          filter: 'drop-shadow(0 0 3px hsl(var(--primary)))',
        }}
      />
      {/* Arrow head */}
      <path
        d={`M ${toX} ${toY} L ${arrowX1} ${arrowY1} M ${toX} ${toY} L ${arrowX2} ${arrowY2}`}
        stroke="hsl(var(--primary))"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.7}
        fill="none"
      />
      <circle
        cx={toX}
        cy={toY}
        fill="hsl(var(--primary))"
        r={6}
        opacity={0.8}
        style={{
          filter: 'drop-shadow(0 0 4px hsl(var(--primary)))',
        }}
      />
    </g>
  );
};

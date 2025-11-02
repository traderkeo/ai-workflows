import type { AINode, AIEdge } from '../types';

/**
 * Simple hierarchical auto-layout algorithm
 * Arranges nodes in levels based on their dependencies
 */
export function autoLayout(nodes: AINode[], edges: AIEdge[]): AINode[] {
  if (nodes.length === 0) return nodes;

  // Build adjacency list for dependencies
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, number>();

  // Initialize maps
  nodes.forEach(node => {
    outgoing.set(node.id, []);
    incoming.set(node.id, 0);
  });

  // Build dependency graph
  edges.forEach(edge => {
    const targets = outgoing.get(edge.source) || [];
    targets.push(edge.target);
    outgoing.set(edge.source, targets);
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
  });

  // Assign nodes to levels using topological sort
  const levels: string[][] = [];
  const processed = new Set<string>();
  const nodeLevel = new Map<string, number>();

  // Start with nodes that have no incoming edges
  let currentLevel: string[] = [];
  nodes.forEach(node => {
    if ((incoming.get(node.id) || 0) === 0) {
      currentLevel.push(node.id);
      nodeLevel.set(node.id, 0);
    }
  });

  while (currentLevel.length > 0) {
    levels.push([...currentLevel]);
    currentLevel.forEach(id => processed.add(id));

    const nextLevel: string[] = [];
    currentLevel.forEach(nodeId => {
      const targets = outgoing.get(nodeId) || [];
      targets.forEach(targetId => {
        // Check if all dependencies of target are processed
        const targetIncoming = edges.filter(e => e.target === targetId);
        const allDepsProcessed = targetIncoming.every(e => processed.has(e.source));

        if (allDepsProcessed && !processed.has(targetId) && !nextLevel.includes(targetId)) {
          nextLevel.push(targetId);
          const currentNodeLevel = nodeLevel.get(nodeId) || 0;
          nodeLevel.set(targetId, currentNodeLevel + 1);
        }
      });
    });

    currentLevel = nextLevel;
  }

  // Add any remaining nodes (disconnected or in cycles)
  nodes.forEach(node => {
    if (!processed.has(node.id)) {
      levels.push([node.id]);
      nodeLevel.set(node.id, levels.length - 1);
    }
  });

  // Calculate positions
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 150;
  const HORIZONTAL_SPACING = 100;
  const VERTICAL_SPACING = 120;

  return nodes.map(node => {
    const level = nodeLevel.get(node.id) || 0;
    const nodesInLevel = levels[level] || [];
    const indexInLevel = nodesInLevel.indexOf(node.id);
    const totalInLevel = nodesInLevel.length;

    // Center nodes in each level
    const levelWidth = totalInLevel * NODE_WIDTH + (totalInLevel - 1) * HORIZONTAL_SPACING;
    const startX = -levelWidth / 2;

    const x = startX + indexInLevel * (NODE_WIDTH + HORIZONTAL_SPACING);
    const y = level * (NODE_HEIGHT + VERTICAL_SPACING);

    return {
      ...node,
      position: { x, y },
    };
  });
}

/**
 * Fit nodes to viewport by centering them
 */
export function centerNodes(nodes: AINode[]): { x: number; y: number; zoom: number } {
  if (nodes.length === 0) return { x: 0, y: 0, zoom: 1 };

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach(node => {
    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x + 200); // Approximate node width
    minY = Math.min(minY, node.position.y);
    maxY = Math.max(maxY, node.position.y + 150); // Approximate node height
  });

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Calculate zoom to fit (with padding)
  const viewportWidth = window.innerWidth * 0.9;
  const viewportHeight = window.innerHeight * 0.9;
  const zoomX = viewportWidth / width;
  const zoomY = viewportHeight / height;
  const zoom = Math.min(zoomX, zoomY, 1.5); // Max zoom of 1.5

  return {
    x: -centerX * zoom + window.innerWidth / 2,
    y: -centerY * zoom + window.innerHeight / 2,
    zoom,
  };
}

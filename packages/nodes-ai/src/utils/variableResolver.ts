import type { AINode, AIEdge } from '../types';

/**
 * Resolves variables in a template string using data from connected nodes
 * Supports:
 * - {{input}} - output from first connected node
 * - {{nodeId}} - output from specific node by ID
 * - {{nodeLabel}} - output from specific node by label
 * - {{nodeId.property}} - specific property from node output
 */
export function resolveVariables(
  template: string,
  currentNodeId: string,
  nodes: AINode[],
  edges: AIEdge[]
): string {
  let resolved = template;

  // Get all nodes connected to this node
  const connectedEdges = edges.filter(e => e.target === currentNodeId);
  const connectedNodeIds = connectedEdges.map(e => e.source);
  const connectedNodes = nodes.filter(n => connectedNodeIds.includes(n.id));

  // Build a map of all available node outputs
  const nodeOutputs = new Map<string, any>();

  nodes.forEach(node => {
    // Check for various output properties that different node types might use
    const output = node.data.result
      ?? node.data.value
      ?? node.data.streamingText
      ?? node.data.results  // For LoopNode
      ?? node.data.conditionMet; // For ConditionNode (fallback)

    if (output !== undefined) {
      // Store by ID
      nodeOutputs.set(node.id, output);
      // Store by name (if exists, lowercase for case-insensitive matching)
      if (node.data.name) {
        nodeOutputs.set(node.data.name.toLowerCase(), output);
      }
      // Store by label (lowercase for case-insensitive matching)
      if (node.data.label) {
        nodeOutputs.set(node.data.label.toLowerCase(), output);
      }
    }
  });

  // Replace {{input}} with first connected node's output
  if (connectedNodes.length > 0) {
    const firstNode = connectedNodes[0];
    const inputValue = firstNode.data.result ?? firstNode.data.value ?? firstNode.data.streamingText;
    if (inputValue !== undefined) {
      resolved = resolved.replace(/\{\{input\}\}/g, String(inputValue));
    }
  }

  // Replace {{nodeId}} or {{nodeLabel}} with specific node outputs
  const nodeRefPattern = /\{\{([a-zA-Z0-9-_ ]+)\}\}/g;
  resolved = resolved.replace(nodeRefPattern, (match, nodeName) => {
    const name = nodeName.trim();

    // Try exact ID match first
    if (nodeOutputs.has(name)) {
      const value = nodeOutputs.get(name);
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }

    // Try case-insensitive label match
    if (nodeOutputs.has(name.toLowerCase())) {
      const value = nodeOutputs.get(name.toLowerCase());
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }

    // Not found, return original
    return match;
  });

  // Replace {{nodeId.property}} or {{nodeLabel.property}} with specific properties
  // Special case: {{node_name.data}} -> resolve to the node's output
  const propertyPattern = /\{\{([a-zA-Z0-9-_ ]+)\.([a-zA-Z0-9_]+)\}\}/g;
  resolved = resolved.replace(propertyPattern, (match, nodeName, property) => {
    const name = nodeName.trim();

    // Try exact ID match first
    let nodeOutput = nodeOutputs.get(name);

    // Try case-insensitive label match
    if (!nodeOutput) {
      nodeOutput = nodeOutputs.get(name.toLowerCase());
    }

    if (nodeOutput) {
      // Special case: .data returns the entire output
      if (property === 'data') {
        return typeof nodeOutput === 'object' ? JSON.stringify(nodeOutput) : String(nodeOutput);
      }

      // Otherwise, try to access the property
      if (typeof nodeOutput === 'object' && nodeOutput[property] !== undefined) {
        const value = nodeOutput[property];
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      }
    }

    // Not found, return original
    return match;
  });

  return resolved;
}

/**
 * Get available variables for a node (for UI hints)
 */
export function getAvailableVariables(
  currentNodeId: string,
  nodes: AINode[],
  edges: AIEdge[]
): string[] {
  const variables: string[] = [];

  // Get all upstream nodes (nodes that come before current node in the graph)
  const upstreamNodeIds = new Set<string>();
  const connectedEdges = edges.filter(e => e.target === currentNodeId);

  connectedEdges.forEach(edge => {
    upstreamNodeIds.add(edge.source);
  });

  if (upstreamNodeIds.size > 0) {
    variables.push('{{input}}');
  }

  // Add all nodes that have outputs
  nodes.forEach(node => {
    if (node.id === currentNodeId) return; // Skip self

    const hasOutput = node.data.result !== undefined ||
                     node.data.value !== undefined ||
                     node.data.streamingText !== undefined ||
                     node.data.results !== undefined || // For LoopNode
                     node.data.conditionMet !== undefined; // For ConditionNode

    if (hasOutput) {
      // Add by name (priority)
      if (node.data.name) {
        variables.push(`{{${node.data.name}}}`);
      }
      // Add by ID
      variables.push(`{{${node.id}}}`);
      // Add by label
      if (node.data.label) {
        variables.push(`{{${node.data.label}}}`);
      }
    }
  });

  return variables;
}

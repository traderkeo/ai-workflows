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

export interface VariableInfo {
  name: string;
  variable: string; // e.g. {{nodeName}}
  value: any;
  type: 'text' | 'object' | 'image' | 'audio' | 'number' | 'boolean' | 'array';
  preview: string; // Short preview of the value
  nodeId: string;
  nodeLabel: string;
}

/**
 * Get all upstream nodes (nodes that come before current node in the graph)
 * This performs a recursive traversal to find ALL ancestors, not just direct parents
 */
function getAllUpstreamNodes(
  currentNodeId: string,
  edges: AIEdge[],
  visited = new Set<string>()
): Set<string> {
  // Find all edges that connect TO this node
  const incomingEdges = edges.filter(e => e.target === currentNodeId);

  incomingEdges.forEach(edge => {
    if (!visited.has(edge.source)) {
      visited.add(edge.source);
      // Recursively find upstream nodes of this source
      getAllUpstreamNodes(edge.source, edges, visited);
    }
  });

  return visited;
}

/**
 * Get detailed information about available variables including their values and types
 */
export function getAvailableVariablesWithInfo(
  currentNodeId: string,
  nodes: AINode[],
  edges: AIEdge[]
): VariableInfo[] {
  const variablesInfo: VariableInfo[] = [];

  // Get ALL upstream nodes (not just directly connected ones)
  const upstreamNodeIds = getAllUpstreamNodes(currentNodeId, edges);

  // Add all upstream nodes (including those without outputs yet)
  nodes.forEach(node => {
    if (node.id === currentNodeId) return; // Skip self

    // ONLY include nodes that are upstream (preceding) this node
    if (!upstreamNodeIds.has(node.id)) return;

    const output = node.data.result
      ?? node.data.value
      ?? node.data.streamingText
      ?? node.data.results  // For LoopNode
      ?? node.data.conditionMet; // For ConditionNode

    // Determine the display name for "from:" label
    const displayName = node.data.name || node.data.label || node.id;

    // Determine the variable name to use
    const varName = node.data.name || node.data.label || node.id;

    // Even if no output yet, show the variable (will be available at runtime)
    if (output !== undefined) {
      const { type, preview } = getValueTypeAndPreview(output, node.data);

      // Build main variable info
      const mainVariable: VariableInfo = {
        name: varName,
        variable: `{{${varName}}}`,
        value: output,
        type,
        preview,
        nodeId: node.id,
        nodeLabel: displayName,
      };

      variablesInfo.push(mainVariable);

      // If the output is an object, also expose its properties as separate variables
      if (typeof output === 'object' && output !== null && !Array.isArray(output)) {
        const keys = Object.keys(output);

        // Add nested property variables (e.g., {{ai-agent-3.image}})
        keys.forEach(key => {
          const propValue = output[key];
          const { type: propType, preview: propPreview } = getValueTypeAndPreview(propValue, {});

          variablesInfo.push({
            name: `${varName}.${key}`,
            variable: `{{${varName}.${key}}}`,
            value: propValue,
            type: propType,
            preview: propPreview,
            nodeId: node.id,
            nodeLabel: `${displayName}.${key}`,
          });
        });
      }
    } else {
      // No output yet, but still show the variable placeholder
      variablesInfo.push({
        name: varName,
        variable: `{{${varName}}}`,
        value: undefined,
        type: 'text',
        preview: '(not executed yet)',
        nodeId: node.id,
        nodeLabel: displayName,
      });
    }
  });

  return variablesInfo;
}

/**
 * Determine the type and preview of a value
 */
function getValueTypeAndPreview(value: any, nodeData: any): { type: VariableInfo['type']; preview: string } {
  // Check if it's an image (has image property or is image result)
  if (nodeData.mode === 'image' || (typeof value === 'object' && value !== null && 'image' in value)) {
    return {
      type: 'image',
      preview: '🖼️ Image data',
    };
  }

  // Check if it's audio (has audio property or is speech/audio result)
  if (nodeData.mode === 'audio' || nodeData.mode === 'speech' || (typeof value === 'object' && value !== null && 'audio' in value)) {
    return {
      type: 'audio',
      preview: '🔊 Audio data',
    };
  }

  // Check primitive types
  if (typeof value === 'string') {
    const truncated = value.length > 100 ? value.substring(0, 100) + '...' : value;
    return { type: 'text', preview: truncated };
  }

  if (typeof value === 'number') {
    return { type: 'number', preview: String(value) };
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean', preview: String(value) };
  }

  if (Array.isArray(value)) {
    return {
      type: 'array',
      preview: `Array (${value.length} items)`,
    };
  }

  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value);
    return {
      type: 'object',
      preview: `Object {${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`,
    };
  }

  return { type: 'text', preview: String(value) };
}

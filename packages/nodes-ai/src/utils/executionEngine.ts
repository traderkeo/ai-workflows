import {
  generateTextNode,
  generateStructuredDataNode,
  WorkflowContext,
  type GenerateTextParams,
  type GenerateStructuredDataParams,
} from '@repo/ai-workers';
import type { AINode, AIEdge, ExecutionContext } from '../types';
import type {
  TextGenerationNodeData,
  StructuredDataNodeData,
  TransformNodeData,
  InputNodeData,
  OutputNodeData,
} from '../types';

/**
 * Build a dependency graph from nodes and edges
 */
function buildDependencyGraph(nodes: AINode[], edges: AIEdge[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  // Initialize all nodes
  nodes.forEach((node) => {
    graph.set(node.id, new Set());
  });

  // Add dependencies (edges point from source to target, so target depends on source)
  edges.forEach((edge) => {
    const dependencies = graph.get(edge.target);
    if (dependencies) {
      dependencies.add(edge.source);
    }
  });

  return graph;
}

/**
 * Get nodes that have no dependencies (ready to execute)
 */
function getReadyNodes(
  graph: Map<string, Set<string>>,
  executed: Set<string>
): string[] {
  const ready: string[] = [];

  graph.forEach((dependencies, nodeId) => {
    if (executed.has(nodeId)) return;

    // Check if all dependencies are executed
    const allDepsExecuted = Array.from(dependencies).every((dep) => executed.has(dep));
    if (allDepsExecuted) {
      ready.push(nodeId);
    }
  });

  return ready;
}

/**
 * Execute a single node
 */
async function executeNode(
  node: AINode,
  context: ExecutionContext,
  workflowContext: WorkflowContext,
  edges: AIEdge[],
  onNodeUpdate: (nodeId: string, updates: any) => void
): Promise<any> {
  const startTime = Date.now();

  try {
    onNodeUpdate(node.id, { status: 'running' });

    // Get input from connected nodes
    const inputs = edges
      .filter((edge) => edge.target === node.id)
      .map((edge) => context.nodeResults.get(edge.source))
      .filter((result) => result !== undefined);

    const input = inputs.length === 1 ? inputs[0] : inputs.length > 1 ? inputs : null;

    let result: any;

    switch (node.type) {
      case 'input': {
        const data = node.data as InputNodeData;
        result = data.value;
        break;
      }

      case 'text-generation': {
        const data = node.data as TextGenerationNodeData;

        // Use input as prompt if prompt is empty
        const prompt = data.prompt || String(input || '');

        const params: GenerateTextParams = {
          prompt,
          model: data.model,
          temperature: data.temperature,
          maxTokens: data.maxTokens,
          systemPrompt: data.systemPrompt,
          context: workflowContext,
          abortSignal: context.abortSignal,
        };

        const response = await generateTextNode(params);

        if (!response.success) {
          throw new Error(response.error || 'Text generation failed');
        }

        onNodeUpdate(node.id, {
          result: response.text,
          usage: response.usage,
        });

        result = response.text;
        break;
      }

      case 'structured-data': {
        const data = node.data as StructuredDataNodeData;

        if (!data.schema) {
          throw new Error('Schema is required for structured data generation');
        }

        const prompt = data.prompt || String(input || '');

        const params: GenerateStructuredDataParams<any> = {
          prompt,
          schema: data.schema,
          schemaName: data.schemaName,
          schemaDescription: data.schemaDescription,
          model: data.model,
          temperature: data.temperature,
          context: workflowContext,
          abortSignal: context.abortSignal,
        };

        const response = await generateStructuredDataNode(params);

        if (!response.success) {
          throw new Error(response.error || 'Structured data generation failed');
        }

        onNodeUpdate(node.id, {
          result: response.object,
          usage: response.usage,
        });

        result = response.object;
        break;
      }

      case 'transform': {
        const data = node.data as TransformNodeData;

        if (!data.transformCode) {
          throw new Error('Transform code is required');
        }

        // Execute the transform code
        // eslint-disable-next-line no-new-func
        const transformFn = new Function('input', data.transformCode);
        result = await transformFn(input);

        onNodeUpdate(node.id, { result });
        break;
      }

      case 'output': {
        result = input;
        onNodeUpdate(node.id, { value: input });
        break;
      }

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }

    const executionTime = Date.now() - startTime;
    onNodeUpdate(node.id, {
      status: 'success',
      executionTime,
    });

    return result;
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error.message || 'Unknown error';

    context.errors.set(node.id, error);
    onNodeUpdate(node.id, {
      status: 'error',
      error: errorMessage,
      executionTime,
    });

    throw error;
  }
}

/**
 * Execute the workflow
 */
export async function executeWorkflow(
  nodes: AINode[],
  edges: AIEdge[],
  onNodeUpdate: (nodeId: string, updates: any) => void,
  abortSignal?: AbortSignal
): Promise<ExecutionContext> {
  const context: ExecutionContext = {
    nodeResults: new Map(),
    errors: new Map(),
    startTime: Date.now(),
    abortSignal,
  };

  const workflowContext = new WorkflowContext();
  const dependencyGraph = buildDependencyGraph(nodes, edges);
  const executed = new Set<string>();
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  // Reset all nodes to idle
  nodes.forEach((node) => {
    onNodeUpdate(node.id, {
      status: 'idle',
      error: undefined,
      executionTime: undefined,
    });
  });

  try {
    // Execute nodes in topological order
    while (executed.size < nodes.length) {
      if (abortSignal?.aborted) {
        throw new Error('Workflow execution aborted');
      }

      const readyNodes = getReadyNodes(dependencyGraph, executed);

      if (readyNodes.length === 0) {
        // Check if we've executed all nodes or if there's a cycle
        if (executed.size < nodes.length) {
          throw new Error('Workflow has circular dependencies or disconnected nodes');
        }
        break;
      }

      // Execute ready nodes in parallel
      await Promise.all(
        readyNodes.map(async (nodeId) => {
          const node = nodeMap.get(nodeId);
          if (!node) return;

          try {
            const result = await executeNode(
              node,
              context,
              workflowContext,
              edges,
              onNodeUpdate
            );
            context.nodeResults.set(nodeId, result);
            executed.add(nodeId);
          } catch (error) {
            // Error already handled in executeNode
            executed.add(nodeId); // Mark as executed even if failed
          }
        })
      );
    }

    return context;
  } catch (error: any) {
    console.error('Workflow execution failed:', error);
    throw error;
  }
}

/**
 * Validate the workflow before execution
 */
export function validateWorkflow(nodes: AINode[], edges: AIEdge[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for at least one input node
  const hasInput = nodes.some((node) => node.type === 'input');
  if (!hasInput) {
    errors.push('Workflow must have at least one Input node');
  }

  // Check for at least one output node
  const hasOutput = nodes.some((node) => node.type === 'output');
  if (!hasOutput) {
    errors.push('Workflow must have at least one Output node');
  }

  // Check for disconnected nodes (except input nodes)
  const connectedNodes = new Set<string>();
  edges.forEach((edge) => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  nodes.forEach((node) => {
    if (node.type !== 'input' && !connectedNodes.has(node.id)) {
      errors.push(`Node "${node.data.label}" is not connected`);
    }
  });

  // Check for circular dependencies (simplified check)
  const dependencyGraph = buildDependencyGraph(nodes, edges);
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const dependencies = dependencyGraph.get(nodeId) || new Set();
    for (const dep of dependencies) {
      if (!visited.has(dep)) {
        if (hasCycle(dep)) return true;
      } else if (recursionStack.has(dep)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        errors.push('Workflow contains circular dependencies');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

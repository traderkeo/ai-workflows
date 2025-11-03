import {
  WorkflowContext,
} from '@repo/ai-workers';
import type { AINode, AIEdge, ExecutionContext } from '../types';
import type {
  AIAgentNodeData,
  TextGenerationNodeData,
  StructuredDataNodeData,
  TransformNodeData,
  StartNodeData,
  StopNodeData,
} from '../types';
import type { MergeNodeData } from '../nodes/MergeNode';
import type { ConditionNodeData } from '../nodes/ConditionNode';
import type { TemplateNodeData } from '../nodes/TemplateNode';
import type { HttpRequestNodeData, LoopNodeData } from '../types';
import { resolveVariables } from './variableResolver';

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
  nodes: AINode[],
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
      case 'start': {
        const data = node.data as StartNodeData;
        result = data.value;
        break;
      }

      case 'ai-agent': {
        const data = node.data as AIAgentNodeData;
        const mode = data.mode || 'text';

        // Resolve variables in prompt and instructions
        let resolvedPrompt = data.prompt || '';
        if (!resolvedPrompt.trim() && input !== undefined) {
          resolvedPrompt = String(input);
        }
        resolvedPrompt = resolveVariables(resolvedPrompt, node.id, nodes, edges);

        const resolvedInstructions = data.instructions
          ? resolveVariables(data.instructions, node.id, nodes, edges)
          : undefined;

        if (!resolvedPrompt.trim()) {
          throw new Error('Prompt is required for AI agent');
        }

        if (mode === 'text') {
          // Text generation mode
          const apiResponse = await fetch('/api/workflows/test-node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeType: 'text-generation',
              config: {
                prompt: resolvedPrompt,
                model: data.model || 'gpt-4o-mini',
                temperature: data.temperature ?? 0.7,
                maxTokens: data.maxTokens ?? 1000,
                systemPrompt: resolvedInstructions,
              },
            }),
            signal: context.abortSignal,
          });

          if (!apiResponse.ok) {
            const error = await apiResponse.json();
            throw new Error(error.error || 'Text generation failed');
          }

          // Handle streaming response
          const reader = apiResponse.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) throw new Error('No reader available');

          let finalText = '';
          let finalUsage: any = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const responseData = JSON.parse(line.slice(6));

                if (responseData.error) {
                  throw new Error(responseData.error);
                }

                if (responseData.fullText) {
                  finalText = responseData.fullText;
                  onNodeUpdate(node.id, { streamingText: finalText, isStreaming: true });
                }

                if (responseData.done) {
                  finalText = responseData.text || responseData.fullText || '';
                  finalUsage = responseData.usage;
                  onNodeUpdate(node.id, {
                    result: finalText,
                    usage: finalUsage,
                    isStreaming: false,
                    streamingText: undefined,
                  });
                }
              }
            }
          }

          result = finalText;
        } else if (mode === 'structured') {
          // Structured data mode
          const buildSchema = () => {
            if (!data.schemaFields || data.schemaFields.length === 0) {
              return null;
            }
            const schemaObj: Record<string, any> = {};
            data.schemaFields.filter(f => f.name.trim()).forEach(field => {
              schemaObj[field.name] = {
                type: field.type,
                description: field.description || undefined
              };
            });
            return schemaObj;
          };

          const schema = buildSchema();
          if (!schema) {
            throw new Error('Schema fields are required for structured data mode');
          }

          const apiResponse = await fetch('/api/workflows/test-node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeType: 'structured-data',
              config: {
                prompt: resolvedPrompt,
                schema,
                schemaName: data.schemaName || 'GeneratedData',
                schemaDescription: data.schemaDescription || 'Structured data schema',
                model: data.model || 'gpt-4o-mini',
                temperature: data.temperature ?? 0.7,
              },
            }),
            signal: context.abortSignal,
          });

          if (!apiResponse.ok) {
            const error = await apiResponse.json();
            throw new Error(error.error || 'Structured data generation failed');
          }

          const response = await apiResponse.json();

          if (!response.success) {
            throw new Error(response.error || 'Structured data generation failed');
          }

          onNodeUpdate(node.id, {
            result: response.object,
            usage: response.usage,
          });

          result = response.object;
        } else if (mode === 'image') {
          const imageOperation = data.imageOperation || 'generate';

          // Helper to resolve image variables
          const resolveImageVariable = (source: string | undefined): string | undefined => {
            if (!source) return undefined;
            if (source.startsWith('{{')) {
              const varName = source.replace(/[{}]/g, '').trim();
              const parts = varName.split('.');
              const nodeIdOrName = parts[0];
              const property = parts[1];

              // Try to find the actual node ID by matching name/label/id
              // context.nodeResults uses actual node IDs as keys
              let actualNodeId = nodeIdOrName;

              // If not found directly, search for it by name/label
              if (!context.nodeResults.has(nodeIdOrName)) {
                const nodeMapEntry = Array.from(context.nodeResults.entries()).find(([id]) => {
                  const node = nodes.find(n => n.id === id);
                  return node && (node.data.name === nodeIdOrName || node.data.label === nodeIdOrName);
                });
                if (nodeMapEntry) {
                  actualNodeId = nodeMapEntry[0];
                }
              }

              const nodeResult = context.nodeResults.get(actualNodeId);
              if (!nodeResult) {
                console.warn(`[Execution] Source node "${nodeIdOrName}" has no result`);
                return undefined;
              }

              if (property === 'image') {
                // Explicitly requesting the image property
                if (typeof nodeResult === 'object' && nodeResult.image) {
                  return nodeResult.image;
                }
                return nodeResult;
              } else if (!property || property === 'result') {
                // No property specified or explicitly requesting result
                // If result is an image object with image property
                if (typeof nodeResult === 'object' && nodeResult.image) {
                  return nodeResult.image;
                }
                // If result is the image directly (base64 string)
                if (typeof nodeResult === 'string') {
                  return nodeResult;
                }
                console.warn(`[Execution] Source node "${nodeIdOrName}" result is not an image:`, nodeResult);
                return undefined;
              } else {
                // Custom property
                return nodeResult[property];
              }
            }
            return source;
          };

          let nodeType = 'image-generation';
          let config: any = {
            prompt: resolvedPrompt,
            model: data.model || 'dall-e-3',
            size: data.imageSize || '1024x1024',
            quality: data.imageQuality || 'standard',
            style: data.imageStyle || 'natural',
            response_format: data.imageResponseFormat || 'b64_json',
            background: data.imageBackground || 'auto',
            moderation: data.imageModeration || 'auto',
            output_format: data.imageOutputFormat || 'png',
            output_compression: data.imageOutputCompression ?? 100,
            n: data.imageNumImages ?? 1,
            stream: data.imageStream ?? false,
            partial_images: data.imagePartialImages ?? 0,
          };

          if (imageOperation === 'edit') {
            nodeType = 'image-edit';
            const resolvedImage = resolveImageVariable(data.imageSource);
            if (!resolvedImage) {
              throw new Error('Image source is required for edit operation');
            }
            config = {
              prompt: resolvedPrompt,
              image: resolvedImage,
              mask: resolveImageVariable(data.imageMask),
              model: data.model || 'dall-e-2',
              size: data.imageSize || '1024x1024',
              response_format: data.imageResponseFormat || 'b64_json',
            };
          } else if (imageOperation === 'variation') {
            nodeType = 'image-variation';
            const resolvedImage = resolveImageVariable(data.imageSource);
            if (!resolvedImage) {
              throw new Error('Image source is required for variation operation');
            }
            config = {
              image: resolvedImage,
              model: data.model || 'dall-e-2',
              size: data.imageSize || '1024x1024',
              response_format: data.imageResponseFormat || 'b64_json',
            };
          }

          const apiResponse = await fetch('/api/workflows/test-node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeType,
              config,
            }),
            signal: context.abortSignal,
          });

          if (!apiResponse.ok) {
            const error = await apiResponse.json();
            throw new Error(error.error || 'Image operation failed');
          }

          const response = await apiResponse.json();

          if (!response.success) {
            throw new Error(response.error || 'Image operation failed');
          }

          onNodeUpdate(node.id, {
            result: {
              type: 'image',
              image: response.image,
              format: response.format,
              revisedPrompt: response.revisedPrompt,
            },
          });

          result = {
            type: 'image',
            image: response.image,
            format: response.format,
            revisedPrompt: response.revisedPrompt,
          };
        } else if (mode === 'speech') {
          // Speech generation mode
          const apiResponse = await fetch('/api/workflows/test-node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeType: 'speech-generation',
              config: {
                text: resolvedPrompt,
                model: data.model || 'tts-1',
                voice: data.voice || 'alloy',
                speed: data.speed ?? 1.0,
                responseFormat: data.responseFormat || 'mp3',
                instructions: resolvedInstructions,
              },
            }),
            signal: context.abortSignal,
          });

          if (!apiResponse.ok) {
            const error = await apiResponse.json();
            throw new Error(error.error || 'Speech generation failed');
          }

          const response = await apiResponse.json();

          if (!response.success) {
            throw new Error(response.error || 'Speech generation failed');
          }

          onNodeUpdate(node.id, {
            result: {
              type: 'audio',
              audio: response.audio,
              format: response.format,
            },
          });

          result = {
            type: 'audio',
            audio: response.audio,
            format: response.format,
          };
        } else if (mode === 'audio') {
          // Audio transcription mode
          throw new Error('Audio transcription requires file upload - not yet implemented in workflow execution');
        } else {
          throw new Error(`Unknown AI agent mode: ${mode}`);
        }
        break;
      }

      case 'text-generation': {
        const data = node.data as TextGenerationNodeData;

        // Use input as prompt if prompt is empty
        let resolvedPrompt = data.prompt || '';
        if (!resolvedPrompt.trim() && input !== undefined) {
          resolvedPrompt = String(input);
        }

        // Resolve all variables in prompt and system prompt
        resolvedPrompt = resolveVariables(resolvedPrompt, node.id, nodes, edges);
        const resolvedSystemPrompt = data.systemPrompt
          ? resolveVariables(data.systemPrompt, node.id, nodes, edges)
          : undefined;

        if (!resolvedPrompt.trim()) {
          throw new Error('Prompt is required for text generation');
        }

        // Call server-side API instead of client-side function
        const apiResponse = await fetch('/api/workflows/test-node', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeType: 'text-generation',
            config: {
              prompt: resolvedPrompt,
              model: data.model || 'gpt-4o-mini',
              temperature: data.temperature ?? 0.7,
              maxTokens: data.maxTokens ?? 1000,
              systemPrompt: resolvedSystemPrompt,
            },
          }),
          signal: context.abortSignal,
        });

        if (!apiResponse.ok) {
          const error = await apiResponse.json();
          throw new Error(error.error || 'Text generation failed');
        }

        // Handle streaming response
        const reader = apiResponse.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('No reader available');

        let finalText = '';
        let finalUsage: any = null;

        while (true) {
          if (context.abortSignal?.aborted) {
            reader.cancel();
            throw new Error('Text generation aborted');
          }

          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const streamData = JSON.parse(line.slice(6));

                if (streamData.error) {
                  throw new Error(streamData.error);
                }

                if (streamData.fullText !== undefined) {
                  finalText = streamData.fullText;
                  onNodeUpdate(node.id, {
                    streamingText: streamData.fullText,
                    isStreaming: true,
                  });
                }

                if (streamData.done) {
                  finalText = streamData.text || streamData.fullText || finalText;
                  finalUsage = streamData.usage || null;
                }
              } catch (parseError) {
                // Skip invalid JSON lines
              }
            }
          }
        }

        onNodeUpdate(node.id, {
          result: finalText,
          streamingText: undefined,
          isStreaming: false,
          usage: finalUsage,
        });

        result = finalText;
        break;
      }

      case 'structured-data': {
        const data = node.data as StructuredDataNodeData;

        // Build schema from schemaFields
        const buildSchema = () => {
          if (!data.schemaFields || data.schemaFields.length === 0) {
            return null;
          }
          const schemaObj: Record<string, any> = {};
          data.schemaFields.filter(f => f.name.trim()).forEach(field => {
            schemaObj[field.name] = {
              type: field.type,
              description: field.description || undefined
            };
          });
          return schemaObj;
        };

        const schema = buildSchema();
        if (!schema) {
          throw new Error('Schema fields are required for structured data generation');
        }

        // Resolve variables in prompt
        let prompt = data.prompt || '';
        if (!prompt.trim() && input !== undefined) {
          prompt = String(input);
        }
        prompt = resolveVariables(prompt, node.id, nodes, edges);

        if (!prompt.trim()) {
          throw new Error('Prompt is required for structured data generation');
        }

        // Call server-side API
        const apiResponse = await fetch('/api/workflows/test-node', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeType: 'structured-data',
            config: {
              prompt,
              schema,
              schemaName: data.schemaName || 'GeneratedData',
              schemaDescription: data.schemaDescription || 'Structured data schema',
              model: data.model || 'gpt-4o-mini',
              temperature: data.temperature ?? 0.7,
            },
          }),
          signal: context.abortSignal,
        });

        if (!apiResponse.ok) {
          const error = await apiResponse.json();
          throw new Error(error.error || 'Structured data generation failed');
        }

        const response = await apiResponse.json();

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

      case 'merge': {
        const data = node.data as MergeNodeData;
        const mergeStrategy = data.mergeStrategy || 'object';

        // Merge based on strategy
        switch (mergeStrategy) {
          case 'array':
            result = Array.isArray(inputs) ? inputs : [inputs];
            break;
          case 'concat':
            result = Array.isArray(inputs)
              ? inputs.map(i => String(i)).join('\n\n')
              : String(inputs);
            break;
          case 'object':
          default:
            if (Array.isArray(inputs)) {
              result = {};
              inputs.forEach((val, idx) => {
                result[`input${idx + 1}`] = val;
              });
            } else {
              result = { input: inputs };
            }
            break;
        }

        onNodeUpdate(node.id, { result });
        break;
      }

      case 'condition': {
        const data = node.data as ConditionNodeData;
        let conditionMet = false;

        switch (data.conditionType) {
          case 'length':
            const minLength = Number(data.conditionValue ?? 100);
            conditionMet = String(input || '').length > minLength;
            break;
          case 'contains':
            const searchText = String(data.conditionValue || '');
            conditionMet = String(input || '').includes(searchText);
            break;
          case 'custom':
            try {
              // eslint-disable-next-line no-new-func
              const conditionFn = new Function('input', data.conditionCode || 'return true;');
              conditionMet = Boolean(conditionFn(input));
            } catch (error: any) {
              throw new Error(`Condition code error: ${error.message}`);
            }
            break;
        }

        onNodeUpdate(node.id, { conditionMet, result: conditionMet });
        result = { condition: conditionMet, data: input };
        break;
      }

      case 'template': {
        const data = node.data as TemplateNodeData;
        let template = data.template || '';

        // Replace {{input}} with the actual input
        if (typeof input === 'object' && input !== null) {
          // Replace {{input.property}} patterns
          template = template.replace(/\{\{input\.(\w+)\}\}/g, (match, prop) => {
            return input[prop] !== undefined ? String(input[prop]) : match;
          });
          // Replace {{input}} with JSON
          template = template.replace(/\{\{input\}\}/g, JSON.stringify(input));
        } else {
          // Replace {{input}} with string value
          template = template.replace(/\{\{input\}\}/g, String(input || ''));
        }

        result = template;
        onNodeUpdate(node.id, { result });
        break;
      }

      case 'stop': {
        result = input;
        onNodeUpdate(node.id, { value: input });
        break;
      }

      case 'http-request': {
        const data = node.data as HttpRequestNodeData;

        // Resolve variables in URL and body
        let url = data.url || '';
        url = resolveVariables(url, node.id, nodes, edges);

        if (!url.trim()) {
          throw new Error('URL is required for HTTP request');
        }

        let body = data.body;
        if (body) {
          body = resolveVariables(body, node.id, nodes, edges);
        }

        // Make the HTTP request
        const requestOptions: RequestInit = {
          method: data.method,
          headers: data.headers || {},
          signal: context.abortSignal,
        };

        if (body && (data.method === 'POST' || data.method === 'PUT' || data.method === 'PATCH')) {
          requestOptions.body = body;
        }

        const response = await fetch(url, requestOptions);
        const responseData = await response.json();

        const httpResult = {
          status: response.status,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries()),
        };

        onNodeUpdate(node.id, { result: httpResult });
        result = responseData;
        break;
      }

      case 'loop': {
        const data = node.data as LoopNodeData;
        const results: any[] = [];
        let iterations = 0;

        switch (data.loopType) {
          case 'count':
            iterations = data.count || 5;
            for (let i = 0; i < iterations; i++) {
              onNodeUpdate(node.id, { currentIteration: i });
              results.push(input);
            }
            break;

          case 'array':
            if (!Array.isArray(input)) {
              throw new Error('Loop input must be an array for array loop type');
            }
            for (let i = 0; i < input.length; i++) {
              onNodeUpdate(node.id, { currentIteration: i });
              results.push(input[i]);
            }
            break;

          case 'condition':
            const conditionCode = data.conditionCode || 'return iteration < 10;';
            // eslint-disable-next-line no-new-func
            const conditionFn = new Function('iteration', 'input', conditionCode);

            let iteration = 0;
            const maxIterations = 1000; // Safety limit

            while (iteration < maxIterations) {
              try {
                const shouldContinue = conditionFn(iteration, input);
                if (!shouldContinue) break;

                onNodeUpdate(node.id, { currentIteration: iteration });
                results.push(input);
                iteration++;
              } catch (error: any) {
                throw new Error(`Loop condition error: ${error.message}`);
              }
            }

            if (iteration >= maxIterations) {
              throw new Error('Loop exceeded maximum iterations (1000)');
            }
            break;
        }

        onNodeUpdate(node.id, { results, result: results, currentIteration: undefined });
        result = results;
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
              nodes,
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

  // Check for at least one start node
  const hasStart = nodes.some((node) => node.type === 'start');
  if (!hasStart) {
    errors.push('Workflow must have at least one Start node');
  }

  // Check for at least one stop node
  const hasStop = nodes.some((node) => node.type === 'stop');
  if (!hasStop) {
    errors.push('Workflow must have at least one Stop node');
  }

  // Check for disconnected nodes (except start nodes)
  const connectedNodes = new Set<string>();
  edges.forEach((edge) => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  nodes.forEach((node) => {
    if (node.type !== 'start' && !connectedNodes.has(node.id)) {
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

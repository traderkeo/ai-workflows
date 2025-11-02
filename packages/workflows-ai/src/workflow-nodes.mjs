/**
 * Enhanced AI Workflow Nodes
 *
 * Node-based architecture where each node:
 * - Accepts inputs from previous nodes
 * - Processes data with AI or transformations
 * - Outputs results to connected nodes
 * - Supports streaming for real-time feedback
 */

import { generateTextNode, generateStructuredDataNode, streamTextNode } from '@repo/ai-workers';

/**
 * Base Node class - all nodes extend from this
 */
export class WorkflowNode {
  constructor(id, type, config = {}) {
    this.id = id;
    this.type = type;
    this.config = config;
    this.inputs = {}; // Input connections from other nodes
    this.outputs = {}; // Output connections to other nodes
    this.result = null; // Cached result
  }

  /**
   * Connect this node's output to another node's input
   */
  connectTo(targetNode, outputKey = 'default', inputKey = 'default') {
    if (!this.outputs[outputKey]) {
      this.outputs[outputKey] = [];
    }
    this.outputs[outputKey].push({ node: targetNode, inputKey });
    targetNode.inputs[inputKey] = this;
  }

  /**
   * Get input value from connected node
   */
  async getInput(inputKey = 'default') {
    const sourceNode = this.inputs[inputKey];
    if (!sourceNode) {
      return null;
    }

    // Execute source node if not already executed
    if (!sourceNode.result) {
      await sourceNode.execute();
    }

    return sourceNode.result;
  }

  /**
   * Execute the node - must be implemented by subclasses
   */
  async execute(context = {}) {
    throw new Error('execute() must be implemented by subclass');
  }
}

/**
 * Input Node - Provides initial data to the workflow
 */
export class InputNode extends WorkflowNode {
  constructor(id, data) {
    super(id, 'input');
    this.data = data;
  }

  async execute() {
    this.result = this.data;
    return this.result;
  }
}

/**
 * Text Generation Node - Generates text using AI
 */
export class TextGenNode extends WorkflowNode {
  constructor(id, config = {}) {
    super(id, 'text-generation', config);
  }

  async execute(context = {}) {
    const { sendUpdate } = context;

    // Get prompt from input or use config
    const inputData = await this.getInput('prompt');
    const prompt = this.config.prompt || inputData || '';

    if (sendUpdate) {
      await sendUpdate('progress', {
        step: `Executing node ${this.id}: Text Generation`,
        nodeId: this.id
      });
    }

    const result = await streamTextNode({
      prompt: typeof prompt === 'string' ? prompt : JSON.stringify(prompt),
      model: this.config.model || 'gpt-4o-mini',
      temperature: this.config.temperature ?? 0.7,
      systemPrompt: this.config.systemPrompt || '',
      onChunk: (chunk, fullText) => {
        if (sendUpdate) {
          sendUpdate('text-chunk', {
            nodeId: this.id,
            chunk,
            fullText,
            stepType: 'text-generation',
          });
        }
      },
    });

    if (!result.success) {
      throw new Error(result.error || 'Text generation failed');
    }

    this.result = {
      text: result.text,
      usage: result.usage,
      model: result.metadata.model,
    };

    if (sendUpdate) {
      await sendUpdate('node-complete', {
        nodeId: this.id,
        type: 'text-generation',
        result: this.result,
      });
    }

    return this.result;
  }
}

/**
 * Structured Data Node - Extracts structured data using AI
 */
export class StructuredDataNode extends WorkflowNode {
  constructor(id, config = {}) {
    super(id, 'structured-data', config);
  }

  async execute(context = {}) {
    const { sendUpdate } = context;

    // Get prompt from input or use config
    const inputData = await this.getInput('prompt');
    const prompt = this.config.prompt || inputData || '';

    if (sendUpdate) {
      await sendUpdate('progress', {
        step: `Executing node ${this.id}: Structured Data Extraction`,
        nodeId: this.id
      });
    }

    const result = await generateStructuredDataNode({
      prompt: typeof prompt === 'string' ? prompt : JSON.stringify(prompt),
      schema: this.config.schema,
      schemaName: this.config.schemaName || 'data',
      model: this.config.model || 'gpt-4o-mini',
    });

    if (!result.success) {
      throw new Error(result.error || 'Structured data extraction failed');
    }

    this.result = {
      data: result.object,
      usage: result.usage,
      model: result.metadata.model,
    };

    if (sendUpdate) {
      await sendUpdate('node-complete', {
        nodeId: this.id,
        type: 'structured-data',
        result: this.result,
      });
    }

    return this.result;
  }
}

/**
 * Transform Node - Applies custom transformation to data
 */
export class TransformNode extends WorkflowNode {
  constructor(id, transformFn) {
    super(id, 'transform');
    this.transformFn = transformFn;
  }

  async execute(context = {}) {
    const { sendUpdate } = context;

    const inputData = await this.getInput();

    if (sendUpdate) {
      await sendUpdate('progress', {
        step: `Executing node ${this.id}: Transform`,
        nodeId: this.id
      });
    }

    this.result = await this.transformFn(inputData);

    if (sendUpdate) {
      await sendUpdate('node-complete', {
        nodeId: this.id,
        type: 'transform',
        result: this.result,
      });
    }

    return this.result;
  }
}

/**
 * Merge Node - Combines outputs from multiple nodes
 */
export class MergeNode extends WorkflowNode {
  constructor(id, mergeStrategy = 'object') {
    super(id, 'merge');
    this.mergeStrategy = mergeStrategy; // 'object', 'array', 'concat'
  }

  async execute(context = {}) {
    const { sendUpdate } = context;

    if (sendUpdate) {
      await sendUpdate('progress', {
        step: `Executing node ${this.id}: Merge`,
        nodeId: this.id
      });
    }

    // Get all inputs
    const inputKeys = Object.keys(this.inputs);
    const inputs = {};

    for (const key of inputKeys) {
      inputs[key] = await this.getInput(key);
    }

    // Merge based on strategy
    switch (this.mergeStrategy) {
      case 'array':
        this.result = Object.values(inputs);
        break;
      case 'concat':
        this.result = Object.values(inputs).join('\n\n');
        break;
      case 'object':
      default:
        this.result = inputs;
        break;
    }

    if (sendUpdate) {
      await sendUpdate('node-complete', {
        nodeId: this.id,
        type: 'merge',
        result: this.result,
      });
    }

    return this.result;
  }
}

/**
 * Condition Node - Routes to different branches based on condition
 */
export class ConditionNode extends WorkflowNode {
  constructor(id, conditionFn) {
    super(id, 'condition');
    this.conditionFn = conditionFn;
  }

  async execute(context = {}) {
    const { sendUpdate } = context;

    const inputData = await this.getInput();

    if (sendUpdate) {
      await sendUpdate('progress', {
        step: `Executing node ${this.id}: Condition`,
        nodeId: this.id
      });
    }

    const conditionResult = await this.conditionFn(inputData);

    this.result = {
      condition: conditionResult,
      data: inputData,
    };

    if (sendUpdate) {
      await sendUpdate('condition-evaluated', {
        nodeId: this.id,
        condition: conditionResult,
      });
    }

    return this.result;
  }
}

/**
 * Template Node - Creates prompts from templates
 */
export class TemplateNode extends WorkflowNode {
  constructor(id, template) {
    super(id, 'template');
    this.template = template;
  }

  async execute(context = {}) {
    const { sendUpdate } = context;

    const inputData = await this.getInput();

    if (sendUpdate) {
      await sendUpdate('progress', {
        step: `Executing node ${this.id}: Template`,
        nodeId: this.id
      });
    }

    // Replace template variables
    let result = this.template;
    if (typeof inputData === 'object') {
      Object.keys(inputData).forEach(key => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), inputData[key]);
      });
    } else {
      result = result.replace(/{{input}}/g, inputData);
    }

    this.result = result;

    if (sendUpdate) {
      await sendUpdate('node-complete', {
        nodeId: this.id,
        type: 'template',
        result: this.result,
      });
    }

    return this.result;
  }
}

/**
 * Output Node - Collects final workflow output
 */
export class OutputNode extends WorkflowNode {
  constructor(id) {
    super(id, 'output');
  }

  async execute(context = {}) {
    const inputData = await this.getInput();
    this.result = inputData;
    return this.result;
  }
}

/**
 * Workflow Graph - Manages nodes and execution
 */
export class WorkflowGraph {
  constructor() {
    this.nodes = new Map();
    this.executionOrder = [];
  }

  addNode(node) {
    this.nodes.set(node.id, node);
    return node;
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  /**
   * Execute the workflow graph in topological order
   */
  async execute(context = {}) {
    // Find nodes with no inputs (starting nodes)
    const visited = new Set();
    const results = {};

    const executeNode = async (node) => {
      if (visited.has(node.id)) {
        return node.result;
      }

      visited.add(node.id);

      // Execute all input dependencies first
      for (const inputKey of Object.keys(node.inputs)) {
        const sourceNode = node.inputs[inputKey];
        if (!visited.has(sourceNode.id)) {
          await executeNode(sourceNode);
        }
      }

      // Execute this node
      const result = await node.execute(context);
      results[node.id] = result;

      return result;
    };

    // Execute all nodes
    for (const node of this.nodes.values()) {
      if (!visited.has(node.id)) {
        await executeNode(node);
      }
    }

    return results;
  }

  /**
   * Reset all node results
   */
  reset() {
    for (const node of this.nodes.values()) {
      node.result = null;
    }
  }
}

/**
 * Workflow Builder - Fluent API for building node-based workflows
 *
 * Provides an easy-to-use API for constructing complex AI workflows
 * using the node-based architecture.
 */

import {
  WorkflowGraph,
  InputNode,
  TextGenNode,
  StructuredDataNode,
  TransformNode,
  MergeNode,
  ConditionNode,
  TemplateNode,
  OutputNode,
} from './workflow-nodes.mjs';

export class WorkflowBuilder {
  constructor() {
    this.graph = new WorkflowGraph();
    this.nodeCounter = 0;
  }

  /**
   * Generate a unique node ID
   */
  generateId(prefix = 'node') {
    return `${prefix}_${++this.nodeCounter}`;
  }

  /**
   * Add an input node
   */
  input(data, id = null) {
    const nodeId = id || this.generateId('input');
    const node = new InputNode(nodeId, data);
    this.graph.addNode(node);
    return new NodeWrapper(this, node);
  }

  /**
   * Get an existing node
   */
  getNode(id) {
    return new NodeWrapper(this, this.graph.getNode(id));
  }

  /**
   * Execute the workflow
   */
  async run(context = {}) {
    return await this.graph.execute(context);
  }

  /**
   * Reset the workflow
   */
  reset() {
    this.graph.reset();
  }

  /**
   * Export workflow to JSON
   */
  toJSON() {
    const nodes = [];
    const connections = [];

    for (const [id, node] of this.graph.nodes) {
      nodes.push({
        id: node.id,
        type: node.type,
        config: node.config,
      });

      // Export connections
      for (const [outputKey, outputs] of Object.entries(node.outputs)) {
        for (const output of outputs) {
          connections.push({
            from: node.id,
            to: output.node.id,
            outputKey,
            inputKey: output.inputKey,
          });
        }
      }
    }

    return { nodes, connections };
  }

  /**
   * Import workflow from JSON
   */
  static fromJSON(json) {
    const builder = new WorkflowBuilder();

    // Create all nodes
    const nodeMap = new Map();
    for (const nodeData of json.nodes) {
      let node;
      switch (nodeData.type) {
        case 'input':
          node = new InputNode(nodeData.id, nodeData.config.data);
          break;
        case 'text-generation':
          node = new TextGenNode(nodeData.id, nodeData.config);
          break;
        case 'structured-data':
          node = new StructuredDataNode(nodeData.id, nodeData.config);
          break;
        case 'transform':
          // Note: transform functions can't be serialized
          node = new TransformNode(nodeData.id, (data) => data);
          break;
        case 'merge':
          node = new MergeNode(nodeData.id, nodeData.config.mergeStrategy);
          break;
        case 'condition':
          // Note: condition functions can't be serialized
          node = new ConditionNode(nodeData.id, (data) => true);
          break;
        case 'template':
          node = new TemplateNode(nodeData.id, nodeData.config.template);
          break;
        case 'output':
          node = new OutputNode(nodeData.id);
          break;
      }

      if (node) {
        builder.graph.addNode(node);
        nodeMap.set(node.id, node);
      }
    }

    // Create connections
    for (const conn of json.connections) {
      const fromNode = nodeMap.get(conn.from);
      const toNode = nodeMap.get(conn.to);
      if (fromNode && toNode) {
        fromNode.connectTo(toNode, conn.outputKey, conn.inputKey);
      }
    }

    return builder;
  }
}

/**
 * Node Wrapper - Provides fluent API for node operations
 */
class NodeWrapper {
  constructor(builder, node) {
    this.builder = builder;
    this.node = node;
  }

  /**
   * Connect to a text generation node
   */
  textGen(config = {}, id = null) {
    const nodeId = id || this.builder.generateId('textgen');
    const node = new TextGenNode(nodeId, config);
    this.builder.graph.addNode(node);
    this.node.connectTo(node, 'default', 'prompt');
    return new NodeWrapper(this.builder, node);
  }

  /**
   * Connect to a structured data node
   */
  extract(schema, config = {}, id = null) {
    const nodeId = id || this.builder.generateId('extract');
    const node = new StructuredDataNode(nodeId, { ...config, schema });
    this.builder.graph.addNode(node);
    this.node.connectTo(node, 'default', 'prompt');
    return new NodeWrapper(this.builder, node);
  }

  /**
   * Connect to a transform node
   */
  transform(transformFn, id = null) {
    const nodeId = id || this.builder.generateId('transform');
    const node = new TransformNode(nodeId, transformFn);
    this.builder.graph.addNode(node);
    this.node.connectTo(node);
    return new NodeWrapper(this.builder, node);
  }

  /**
   * Connect to a template node
   */
  template(templateStr, id = null) {
    const nodeId = id || this.builder.generateId('template');
    const node = new TemplateNode(nodeId, templateStr);
    this.builder.graph.addNode(node);
    this.node.connectTo(node);
    return new NodeWrapper(this.builder, node);
  }

  /**
   * Connect to a merge node
   */
  merge(otherNodes, mergeStrategy = 'object', id = null) {
    const nodeId = id || this.builder.generateId('merge');
    const node = new MergeNode(nodeId, mergeStrategy);
    this.builder.graph.addNode(node);

    // Connect this node
    this.node.connectTo(node, 'default', 'input1');

    // Connect other nodes
    otherNodes.forEach((otherNode, index) => {
      otherNode.node.connectTo(node, 'default', `input${index + 2}`);
    });

    return new NodeWrapper(this.builder, node);
  }

  /**
   * Connect to a condition node and branch
   */
  condition(conditionFn, id = null) {
    const nodeId = id || this.builder.generateId('condition');
    const node = new ConditionNode(nodeId, conditionFn);
    this.builder.graph.addNode(node);
    this.node.connectTo(node);
    return new NodeWrapper(this.builder, node);
  }

  /**
   * Connect to an output node
   */
  output(id = null) {
    const nodeId = id || this.builder.generateId('output');
    const node = new OutputNode(nodeId);
    this.builder.graph.addNode(node);
    this.node.connectTo(node);
    return new NodeWrapper(this.builder, node);
  }

  /**
   * Connect to an arbitrary node
   */
  connectTo(targetNode, outputKey = 'default', inputKey = 'default') {
    this.node.connectTo(targetNode.node, outputKey, inputKey);
    return targetNode;
  }

  /**
   * Get the underlying node
   */
  getNode() {
    return this.node;
  }
}

/**
 * Helper function to create a new workflow builder
 */
export function createWorkflow() {
  return new WorkflowBuilder();
}

/**
 * Pre-built workflow templates
 */
export const WorkflowTemplates = {
  /**
   * Content Pipeline: Summarize → Extract Keywords → Generate Title
   */
  contentPipeline: (input, model = 'gpt-4o-mini') => {
    const workflow = createWorkflow();

    workflow
      .input(input)
      .textGen({ prompt: `Summarize this in 2 sentences: ${input}`, model })
      .extract(
        (z) => z.object({
          keywords: z.array(z.string()),
          category: z.string(),
        }),
        { model }
      )
      .transform(data => JSON.stringify(data.data.keywords))
      .textGen({
        prompt: data => `Create a catchy title using these keywords: ${data}`,
        model
      })
      .output();

    return workflow;
  },

  /**
   * Translation Pipeline: Translate to multiple languages in parallel
   */
  translationPipeline: (input, languages = ['French', 'Spanish', 'German'], model = 'gpt-4o-mini') => {
    const workflow = createWorkflow();
    const inputNode = workflow.input(input);

    const translationNodes = languages.map((lang, idx) =>
      workflow
        .input(input, `input_${lang}`)
        .textGen({
          prompt: `Translate to ${lang}: ${input}`,
          model
        }, `translate_${lang}`)
    );

    inputNode.merge(translationNodes, 'object').output();

    return workflow;
  },

  /**
   * Analysis Pipeline: Technical + Business analysis → Synthesis
   */
  analysisPipeline: (input, model = 'gpt-4o-mini') => {
    const workflow = createWorkflow();
    const inputNode = workflow.input(input);

    const technical = workflow
      .input(input, 'input_technical')
      .textGen({
        prompt: `Analyze from a technical perspective: ${input}`,
        model
      }, 'technical');

    const business = workflow
      .input(input, 'input_business')
      .textGen({
        prompt: `Analyze from a business perspective: ${input}`,
        model
      }, 'business');

    inputNode
      .merge([technical, business], 'concat')
      .textGen({
        prompt: data => `Synthesize these perspectives into a balanced conclusion:\n\n${data}`,
        model
      })
      .output();

    return workflow;
  },

  /**
   * Content Moderation: Analyze → Check conditions → Route
   */
  moderationPipeline: (input, model = 'gpt-4o-mini') => {
    const workflow = createWorkflow();

    workflow
      .input(input)
      .extract(
        (z) => z.object({
          isSafe: z.boolean(),
          categories: z.array(z.string()),
          severity: z.enum(['low', 'medium', 'high']),
        }),
        {
          prompt: `Analyze this content for safety and categorize it: ${input}`,
          model
        }
      )
      .condition(data => data.data.isSafe)
      .output();

    return workflow;
  },
};

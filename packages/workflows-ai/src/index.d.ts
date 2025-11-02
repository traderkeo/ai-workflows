/**
 * TypeScript definitions for Workflows AI
 */

import type { z } from 'zod';

// ============================================================================
// Step Types
// ============================================================================

export interface TextGenerationStepParams {
  prompt: string;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
}

export interface TextGenerationStepResult {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export function textGenerationStep(
  params: TextGenerationStepParams
): Promise<TextGenerationStepResult>;

export interface StructuredDataStepParams<T extends z.ZodType = any> {
  prompt: string;
  schema: T;
  schemaName?: string;
  model?: string;
}

export interface StructuredDataStepResult<T = any> {
  data: T;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export function structuredDataStep<T extends z.ZodType>(
  params: StructuredDataStepParams<T>
): Promise<StructuredDataStepResult<z.infer<T>>>;

export interface TransformStepParams<TInput = any, TOutput = any> {
  data: TInput;
  transformer: (data: TInput) => Promise<TOutput> | TOutput;
}

export function transformStep<TInput, TOutput>(
  params: TransformStepParams<TInput, TOutput>
): Promise<TOutput>;

export interface ValidationStepParams<T = any> {
  data: T;
  validator: (data: T) => Promise<boolean> | boolean;
}

export interface ValidationStepResult<T = any> {
  valid: boolean;
  data: T;
}

export function validationStep<T>(
  params: ValidationStepParams<T>
): Promise<ValidationStepResult<T>>;

// ============================================================================
// Workflow Types
// ============================================================================

export type WorkflowStepType = 'text-generation' | 'structured-data' | 'transform' | 'validation';

export interface BaseWorkflowStep {
  type: WorkflowStepType;
  model?: string;
}

export interface TextGenerationWorkflowStep extends BaseWorkflowStep {
  type: 'text-generation';
  prompt?: string;
  temperature?: number;
  systemPrompt?: string;
}

export interface StructuredDataWorkflowStep extends BaseWorkflowStep {
  type: 'structured-data';
  prompt?: string;
  schema: z.ZodType;
  schemaName?: string;
}

export interface TransformWorkflowStep extends BaseWorkflowStep {
  type: 'transform';
  transformer: (data: any) => Promise<any> | any;
}

export type WorkflowStep = TextGenerationWorkflowStep | StructuredDataWorkflowStep | TransformWorkflowStep;

// Sequential Workflow
export interface SequentialWorkflowConfig {
  input: any;
  model?: string;
  writableStream?: WritableStream;
}

export interface SequentialWorkflowResult {
  success: boolean;
  results: Array<{
    step: number;
    type: string;
    result: any;
  }>;
  finalOutput: any;
}

export function sequentialWorkflow(
  config: SequentialWorkflowConfig
): Promise<SequentialWorkflowResult>;

// Parallel Workflow
export interface ParallelWorkflowConfig {
  input: any;
  model?: string;
  writableStream?: WritableStream;
}

export interface ParallelWorkflowResult {
  success: boolean;
  results: Array<{
    task: number;
    type: string;
    result: any;
  }>;
}

export function parallelWorkflow(
  config: ParallelWorkflowConfig
): Promise<ParallelWorkflowResult>;

// Conditional Workflow
export interface ConditionalWorkflowConfig {
  input: any;
  model?: string;
  writableStream?: WritableStream;
}

export interface ConditionalWorkflowResult {
  success: boolean;
  branchTaken: 'true' | 'false';
  result: any;
}

export function conditionalWorkflow(
  config: ConditionalWorkflowConfig
): Promise<ConditionalWorkflowResult>;

// Delayed Workflow
export interface DelayedWorkflowConfig {
  delay: string; // e.g., '5s', '1m', '2h', '1d'
  input: any;
  model?: string;
  writableStream?: WritableStream;
}

export interface DelayedWorkflowResult {
  success: boolean;
  delay: string;
  result: any;
}

export function delayedWorkflow(
  config: DelayedWorkflowConfig
): Promise<DelayedWorkflowResult>;

// Human-in-the-loop Workflow
export interface HumanInLoopWorkflowConfig {
  input: any;
  approvalHook: any; // Hook from defineHook()
  workflowId: string;
  model?: string;
  writableStream?: WritableStream;
}

export interface HumanInLoopWorkflowResult {
  success: boolean;
  approved: boolean;
  revised?: boolean;
  result: any;
  feedback?: string;
}

export function humanInLoopWorkflow(
  config: HumanInLoopWorkflowConfig
): Promise<HumanInLoopWorkflowResult>;

// Retry Workflow
export interface RetryWorkflowConfig {
  input: any;
  maxRetries?: number;
  model?: string;
  writableStream?: WritableStream;
}

export interface RetryWorkflowResult {
  success: boolean;
  attempts: number;
  result?: any;
  error?: string;
}

export function retryWorkflow(
  config: RetryWorkflowConfig
): Promise<RetryWorkflowResult>;

// Complex Workflow
export interface ComplexWorkflowConfig {
  input: string;
  model?: string;
  writableStream?: WritableStream;
}

export interface ComplexWorkflowResult {
  success: boolean;
  parallelResults: Array<any>;
  synthesis: any;
}

export function complexWorkflow(
  config: ComplexWorkflowConfig
): Promise<ComplexWorkflowResult>;

// ============================================================================
// Node-based Workflow System
// ============================================================================

export class WorkflowGraph {
  constructor();
  addNode(node: any): void;
  getNode(id: string): any;
  execute(context?: any): Promise<any>;
  reset(): void;
}

export class InputNode {
  constructor(id: string, data: any);
  connectTo(targetNode: any, outputKey?: string, inputKey?: string): void;
}

export class TextGenNode {
  constructor(id: string, config: any);
  connectTo(targetNode: any, outputKey?: string, inputKey?: string): void;
}

export class StructuredDataNode {
  constructor(id: string, config: any);
  connectTo(targetNode: any, outputKey?: string, inputKey?: string): void;
}

export class TransformNode {
  constructor(id: string, transformFn: (data: any) => any);
  connectTo(targetNode: any, outputKey?: string, inputKey?: string): void;
}

export class MergeNode {
  constructor(id: string, mergeStrategy?: string);
  connectTo(targetNode: any, outputKey?: string, inputKey?: string): void;
}

export class ConditionNode {
  constructor(id: string, conditionFn: (data: any) => boolean);
  connectTo(targetNode: any, outputKey?: string, inputKey?: string): void;
}

export class TemplateNode {
  constructor(id: string, template: string);
  connectTo(targetNode: any, outputKey?: string, inputKey?: string): void;
}

export class OutputNode {
  constructor(id: string);
  connectTo(targetNode: any, outputKey?: string, inputKey?: string): void;
}

// ============================================================================
// Workflow Builder
// ============================================================================

export class WorkflowBuilder {
  constructor();
  generateId(prefix?: string): string;
  input(data: any, id?: string | null): any;
  getNode(id: string): any;
  run(context?: any): Promise<any>;
  reset(): void;
  toJSON(): { nodes: any[]; connections: any[] };
  static fromJSON(json: { nodes: any[]; connections: any[] }): WorkflowBuilder;
}

export function createWorkflow(): WorkflowBuilder;

export const WorkflowTemplates: {
  contentPipeline: (input: string, model?: string) => WorkflowBuilder;
  translationPipeline: (input: string, languages?: string[], model?: string) => WorkflowBuilder;
  analysisPipeline: (input: string, model?: string) => WorkflowBuilder;
  moderationPipeline: (input: string, model?: string) => WorkflowBuilder;
};

// ============================================================================
// Workflow SDK Utilities
// ============================================================================

/**
 * Sleep for a specified duration without consuming compute resources
 * @param duration - Duration string like '5s', '1m', '2h', '1d'
 */
export function sleep(duration: string): Promise<void>;

/**
 * Define a hook for external events
 */
export function defineHook<T = any>(): {
  create: (options: { token: string }) => AsyncIterable<T>;
  resume: (token: string, data: T) => Promise<void>;
};

// ============================================================================
// Default Export
// ============================================================================

declare const workflows: {
  sequential: () => Promise<typeof sequentialWorkflow>;
  parallel: () => Promise<typeof parallelWorkflow>;
  conditional: () => Promise<typeof conditionalWorkflow>;
  delayed: () => Promise<typeof delayedWorkflow>;
  humanInLoop: () => Promise<typeof humanInLoopWorkflow>;
  retry: () => Promise<typeof retryWorkflow>;
  complex: () => Promise<typeof complexWorkflow>;
};

export default workflows;

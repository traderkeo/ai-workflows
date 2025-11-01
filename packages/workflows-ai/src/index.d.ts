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
  steps: WorkflowStep[];
  input: any;
  model?: string;
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
  tasks: WorkflowStep[];
  model?: string;
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
  condition: (input: any) => Promise<boolean> | boolean;
  trueBranch: WorkflowStep;
  falseBranch: WorkflowStep;
  input: any;
  model?: string;
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
  task: WorkflowStep;
  model?: string;
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
  initialTask: WorkflowStep;
  approvalHook: any; // Hook from defineHook()
  workflowId: string;
  model?: string;
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
  task: WorkflowStep;
  maxRetries?: number;
  model?: string;
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

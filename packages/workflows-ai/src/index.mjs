/**
 * Workflows AI - Durable AI Workflows
 *
 * Main entry point for the workflows-ai package.
 * Provides durable, pausable, resumable AI workflows using Vercel Workflow SDK.
 */

// Export workflow steps
export {
  textGenerationStep,
  structuredDataStep,
  transformStep,
  validationStep,
} from './workflow-steps.mjs';

// Export workflow orchestrators
export {
  sequentialWorkflow,
  parallelWorkflow,
  conditionalWorkflow,
  delayedWorkflow,
  humanInLoopWorkflow,
  retryWorkflow,
  complexWorkflow,
} from './workflow-orchestrator.mjs';

// Re-export Vercel Workflow SDK utilities
export { sleep, defineHook } from 'workflow';

// Default export with all workflows
const workflows = {
  sequential: () => import('./workflow-orchestrator.mjs').then(m => m.sequentialWorkflow),
  parallel: () => import('./workflow-orchestrator.mjs').then(m => m.parallelWorkflow),
  conditional: () => import('./workflow-orchestrator.mjs').then(m => m.conditionalWorkflow),
  delayed: () => import('./workflow-orchestrator.mjs').then(m => m.delayedWorkflow),
  humanInLoop: () => import('./workflow-orchestrator.mjs').then(m => m.humanInLoopWorkflow),
  retry: () => import('./workflow-orchestrator.mjs').then(m => m.retryWorkflow),
  complex: () => import('./workflow-orchestrator.mjs').then(m => m.complexWorkflow),
};

export default workflows;

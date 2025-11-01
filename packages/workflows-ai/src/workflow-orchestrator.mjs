/**
 * AI Workflow Orchestrator
 *
 * Workflow functions that execute AI operations with real-time streaming.
 */

import {
  textGenerationStep,
  structuredDataStep,
  transformStep,
  validationStep,
} from './workflow-steps.mjs';

/**
 * Sequential AI workflow - processes steps one after another
 * @param {Object} config - Workflow configuration
 * @param {WritableStream} config.writableStream - Stream to send SSE updates
 * @returns {Promise<Object>} Workflow result
 */
export async function sequentialWorkflow(config) {
  const { input, model, writableStream } = config;
  
  if (!writableStream) {
    throw new Error('writableStream is required');
  }
  
  const writer = writableStream.getWriter();
  const encoder = new TextEncoder();

  // Helper to send SSE updates
  const sendUpdate = async (type, data) => {
    const message = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
    await writer.write(encoder.encode(message));
  };

  await sendUpdate('start', { workflowType: 'sequential', model });

  const results = [];
  const steps = [
    {
      type: 'text-generation',
      prompt: `Summarize this in 2 sentences: ${input}`,
      temperature: 0.3,
    },
    {
      type: 'structured-data',
      prompt: `Extract keywords from: ${input}`,
    },
    {
      type: 'text-generation',
      prompt: null, // Will use previous step output
      temperature: 0.8,
    },
  ];

  let currentInput = input;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    await sendUpdate('progress', { step: `Executing step ${i + 1}...`, stepNumber: i + 1 });

    // Execute step based on type
    let stepResult;

    switch (step.type) {
      case 'text-generation':
        // For step 3, use keywords from previous step
        let prompt = step.prompt;
        if (!prompt && i === 2) {
          // Step 3: Create title from keywords
          try {
            const keywords = typeof currentInput === 'string' ? JSON.parse(currentInput) : currentInput;
            prompt = `Create a catchy title using these keywords: ${JSON.stringify(keywords.keywords || keywords)}`;
          } catch {
            prompt = `Create a catchy title for: ${currentInput}`;
          }
        } else {
          prompt = prompt || currentInput;
        }
        stepResult = await textGenerationStep({
          prompt,
          model: model || step.model,
          temperature: step.temperature,
          systemPrompt: step.systemPrompt,
        });
        currentInput = stepResult.text;
        break;

      case 'structured-data':
        const { z } = await import('zod');
        stepResult = await structuredDataStep({
          prompt: step.prompt || currentInput,
          schema: z.object({
            keywords: z.array(z.string()).describe('Important keywords'),
            category: z.string().describe('Content category'),
          }),
          schemaName: step.schemaName || 'keywords',
          model: model || step.model,
        });
        // Pass structured data object to next step (will be converted if needed)
        currentInput = stepResult.data;
        break;

      case 'transform':
        stepResult = await transformStep({
          data: currentInput,
          transformer: step.transformer,
        });
        currentInput = stepResult;
        break;

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }

    results.push({
      step: i + 1,
      type: step.type,
      result: stepResult,
    });

    // Send step completion update
    await sendUpdate('step-complete', {
      stepNumber: i + 1,
      type: step.type,
      result: stepResult,
    });
  }

  const finalResult = {
    success: true,
    results,
    finalOutput: currentInput,
  };

  await sendUpdate('complete', { result: finalResult });

  await writer.close();
  writer.releaseLock();

  return finalResult;
}

/**
 * Parallel AI workflow - executes multiple steps simultaneously
 * @param {Object} config - Workflow configuration
 * @param {WritableStream} config.writableStream - Stream to send SSE updates
 * @returns {Promise<Object>} Workflow result with all parallel results
 */
export async function parallelWorkflow(config) {
  const { tasks, model, input, writableStream } = config;
  
  if (!writableStream) {
    throw new Error('writableStream is required');
  }
  
  const writer = writableStream.getWriter();
  const encoder = new TextEncoder();

  // Helper to send SSE updates
  const sendUpdate = async (type, data) => {
    const message = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
    await writer.write(encoder.encode(message));
  };

  await sendUpdate('start', { workflowType: 'parallel', model });
  await sendUpdate('progress', { step: `Starting ${tasks?.length || 3} parallel tasks...` });

  // Define default tasks if not provided
  const parallelTasks = tasks || [
    {
      type: 'text-generation',
      prompt: `Translate to French: ${input}`,
      temperature: 0.3,
    },
    {
      type: 'text-generation',
      prompt: `Translate to Spanish: ${input}`,
      temperature: 0.3,
    },
    {
      type: 'text-generation',
      prompt: `Translate to German: ${input}`,
      temperature: 0.3,
    },
  ];

  // Execute all tasks in parallel
  const results = await Promise.all(
    parallelTasks.map(async (task, index) => {
      await sendUpdate('progress', {
        step: `Executing parallel task ${index + 1}...`,
        taskNumber: index + 1
      });

      let result;

      switch (task.type) {
        case 'text-generation':
          result = await textGenerationStep({
            prompt: task.prompt,
            model: model || task.model,
            temperature: task.temperature,
            systemPrompt: task.systemPrompt,
          });
          break;

        case 'structured-data':
          result = await structuredDataStep({
            prompt: task.prompt,
            schema: task.schema,
            schemaName: task.schemaName,
            model: model || task.model,
          });
          break;

        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      await sendUpdate('step-complete', {
        taskNumber: index + 1,
        type: task.type,
        result,
      });

      return {
        task: index + 1,
        type: task.type,
        result,
      };
    })
  );

  await sendUpdate('parallel-complete', { results });

  const finalResult = {
    success: true,
    results,
  };

  await sendUpdate('complete', { result: finalResult });

  await writer.close();
  writer.releaseLock();

  return finalResult;
}

/**
 * Conditional AI workflow - branches based on conditions
 * @param {Object} config - Workflow configuration
 * @param {WritableStream} config.writableStream - Stream to send SSE updates
 * @returns {Promise<Object>} Workflow result from chosen branch
 */
export async function conditionalWorkflow(config) {
  const { condition, trueBranch, falseBranch, input, model, writableStream } = config;
  
  if (!writableStream) {
    throw new Error('writableStream is required');
  }
  
  const writer = writableStream.getWriter();
  const encoder = new TextEncoder();

  // Helper to send SSE updates
  const sendUpdate = async (type, data) => {
    const message = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
    await writer.write(encoder.encode(message));
  };

  await sendUpdate('start', { workflowType: 'conditional', model });
  await sendUpdate('progress', { step: 'Evaluating condition...' });

  // Default condition: check if text is long (>100 chars)
  const conditionFn = condition || ((text) => text.length > 100);
  const conditionResult = conditionFn(input);

  await sendUpdate('condition-evaluated', {
    isLongText: conditionResult,
    textLength: input.length,
  });

  // Execute chosen branch
  const branch = conditionResult ? trueBranch : falseBranch;

  // Default branches if not provided
  const selectedBranch = branch || (conditionResult
    ? {
        type: 'text-generation',
        prompt: `Summarize this text concisely: ${input}`,
        temperature: 0.3,
      }
    : {
        type: 'text-generation',
        prompt: `Expand on this text with more details and examples: ${input}`,
        temperature: 0.7,
      });

  const branchName = conditionResult ? 'true (long text - summarize)' : 'false (short text - expand)';
  await sendUpdate('progress', { step: `Executing ${branchName} branch...` });

  let result;

  switch (selectedBranch.type) {
    case 'text-generation':
      result = await textGenerationStep({
        prompt: selectedBranch.prompt || input,
        model: model || selectedBranch.model,
        temperature: selectedBranch.temperature,
        systemPrompt: selectedBranch.systemPrompt,
      });
      break;

    case 'structured-data':
      result = await structuredDataStep({
        prompt: selectedBranch.prompt || input,
        schema: selectedBranch.schema,
        schemaName: selectedBranch.schemaName,
        model: model || selectedBranch.model,
      });
      break;

    default:
      throw new Error(`Unknown branch type: ${selectedBranch.type}`);
  }

  await sendUpdate('branch-executed', {
    branchTaken: conditionResult ? 'true' : 'false',
    result,
  });

  const finalResult = {
    success: true,
    branchTaken: conditionResult ? 'true' : 'false',
    result,
  };

  await sendUpdate('complete', { result: finalResult });

  await writer.close();
  writer.releaseLock();

  return finalResult;
}

/**
 * Delayed workflow - waits before executing
 * @param {Object} config - Workflow configuration
 * @returns {Promise<Object>} Workflow result after delay
 */
export async function delayedWorkflow(config) {

  const { delay, task, model } = config;

  // Sleep for specified duration (in milliseconds)
  await new Promise(resolve => setTimeout(resolve, delay || 0));

  // Execute task after delay
  let result;

  switch (task.type) {
    case 'text-generation':
      result = await textGenerationStep({
        prompt: task.prompt,
        model: model || task.model,
        temperature: task.temperature,
        systemPrompt: task.systemPrompt,
      });
      break;

    case 'structured-data':
      result = await structuredDataStep({
        prompt: task.prompt,
        schema: task.schema,
        schemaName: task.schemaName,
        model: model || task.model,
      });
      break;

    default:
      throw new Error(`Unknown task type: ${task.type}`);
  }

  return {
    success: true,
    delay,
    result,
  };
}

/**
 * Human-in-the-loop workflow - waits for external approval/input
 * @param {Object} config - Workflow configuration
 * @returns {Promise<Object>} Workflow result including human feedback
 */
export async function humanInLoopWorkflow(config) {
  'use workflow';

  const { initialTask, approvalHook, model } = config;

  // Execute initial task
  let initialResult;

  switch (initialTask.type) {
    case 'text-generation':
      initialResult = await textGenerationStep({
        prompt: initialTask.prompt,
        model: model || initialTask.model,
        temperature: initialTask.temperature,
        systemPrompt: initialTask.systemPrompt,
      });
      break;

    case 'structured-data':
      initialResult = await structuredDataStep({
        prompt: initialTask.prompt,
        schema: initialTask.schema,
        schemaName: initialTask.schemaName,
        model: model || initialTask.model,
      });
      break;

    default:
      throw new Error(`Unknown task type: ${initialTask.type}`);
  }

  // Wait for human approval
  const events = approvalHook.create({ token: config.workflowId });

  for await (const event of events) {
    if (event.action === 'approve') {
      return {
        success: true,
        approved: true,
        result: initialResult,
        feedback: event.feedback,
      };
    } else if (event.action === 'revise') {
      // Execute revision
      const revisionResult = await textGenerationStep({
        prompt: `Revise the following based on feedback: "${event.feedback}"\n\nOriginal: ${
          initialResult.text || JSON.stringify(initialResult.data)
        }`,
        model: model || initialTask.model,
      });

      return {
        success: true,
        approved: true,
        revised: true,
        result: revisionResult,
        feedback: event.feedback,
      };
    } else if (event.action === 'reject') {
      return {
        success: false,
        approved: false,
        result: initialResult,
        feedback: event.feedback,
      };
    }
  }

  // If loop exits without approval (shouldn't happen normally)
  throw new Error('Workflow ended without resolution');
}

/**
 * Retry workflow - automatically retries failed operations
 * @param {Object} config - Workflow configuration
 * @param {WritableStream} config.writableStream - Stream to send SSE updates
 * @returns {Promise<Object>} Workflow result with retry information
 */
export async function retryWorkflow(config) {
  const { task, maxRetries, model, input, writableStream } = config;
  
  if (!writableStream) {
    throw new Error('writableStream is required');
  }
  
  const writer = writableStream.getWriter();
  const encoder = new TextEncoder();

  // Helper to send SSE updates
  const sendUpdate = async (type, data) => {
    const message = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
    await writer.write(encoder.encode(message));
  };

  await sendUpdate('start', { workflowType: 'retry', model, maxRetries: maxRetries || 3 });

  // Default task if not provided
  const retryTask = task || {
    type: 'text-generation',
    prompt: input,
    temperature: 0.7,
  };

  let lastError;
  let attempts = 0;

  for (let i = 0; i <= (maxRetries || 3); i++) {
    attempts++;

    await sendUpdate('progress', {
      step: `Attempt ${attempts} of ${(maxRetries || 3) + 1}...`,
      attempt: attempts,
    });

    try {
      let result;

      switch (retryTask.type) {
        case 'text-generation':
          result = await textGenerationStep({
            prompt: retryTask.prompt,
            model: model || retryTask.model,
            temperature: retryTask.temperature,
            systemPrompt: retryTask.systemPrompt,
          });
          break;

        case 'structured-data':
          result = await structuredDataStep({
            prompt: retryTask.prompt,
            schema: retryTask.schema,
            schemaName: retryTask.schemaName,
            model: model || retryTask.model,
          });
          break;

        default:
          throw new Error(`Unknown task type: ${retryTask.type}`);
      }

      await sendUpdate('step-complete', {
        attempt: attempts,
        result,
      });

      const finalResult = {
        success: true,
        attempts,
        result,
      };

      await sendUpdate('retry-complete', {
        attempts,
        result,
      });

      await sendUpdate('complete', { result: finalResult });

      await writer.close();
      writer.releaseLock();

      return finalResult;
    } catch (error) {
      lastError = error;

      await sendUpdate('progress', {
        step: `Attempt ${attempts} failed: ${error.message}`,
        error: error.message,
      });

      // If not last attempt, wait before retry
      if (i < (maxRetries || 3)) {
        const backoffMs = Math.pow(2, i) * 1000;
        await sendUpdate('progress', {
          step: `Waiting ${backoffMs / 1000}s before retry...`,
          backoffSeconds: backoffMs / 1000,
        });
        // Exponential backoff: 1s, 2s, 4s, etc.
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  const failedResult = {
    success: false,
    attempts,
    error: lastError.message,
  };

  await sendUpdate('error', { error: lastError.message, attempts });
  await sendUpdate('complete', { result: failedResult });

  await writer.close();
  writer.releaseLock();

  return failedResult;
}

/**
 * Complex workflow - combines multiple patterns
 * @param {Object} config - Workflow configuration
 * @param {WritableStream} config.writableStream - Stream to send SSE updates
 * @returns {Promise<Object>} Comprehensive workflow result
 */
export async function complexWorkflow(config) {
  const { input, model, writableStream } = config;
  
  if (!writableStream) {
    throw new Error('writableStream is required');
  }
  
  const writer = writableStream.getWriter();
  const encoder = new TextEncoder();

  // Helper to send SSE updates
  const sendUpdate = async (type, data) => {
    const message = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
    await writer.write(encoder.encode(message));
  };

  await sendUpdate('start', { workflowType: 'complex', model });
  await sendUpdate('progress', { step: 'Starting parallel analysis...' });

  // Step 1: Parallel analysis
  await sendUpdate('progress', { step: 'Analyzing from technical perspective...' });
  const technicalResult = await textGenerationStep({
    prompt: `Analyze from a technical perspective: ${input}`,
    model,
  });

  await sendUpdate('step-complete', {
    stepNumber: 1,
    type: 'technical-analysis',
    result: technicalResult,
  });

  await sendUpdate('progress', { step: 'Analyzing from business perspective...' });
  const businessResult = await textGenerationStep({
    prompt: `Analyze from a business perspective: ${input}`,
    model,
  });

  await sendUpdate('step-complete', {
    stepNumber: 2,
    type: 'business-analysis',
    result: businessResult,
  });

  await sendUpdate('parallel-analysis-complete', {
    results: [
      { type: 'technical', result: technicalResult },
      { type: 'business', result: businessResult },
    ],
  });

  // Step 2: Synthesize results
  await sendUpdate('progress', { step: 'Synthesizing perspectives...' });

  const combined = `Technical Perspective:\n${technicalResult.text}\n\nBusiness Perspective:\n${businessResult.text}`;

  const synthesis = await textGenerationStep({
    prompt: `Synthesize these perspectives into a balanced conclusion:\n\n${combined}`,
    model,
  });

  await sendUpdate('synthesis-complete', {
    synthesis,
  });

  const finalResult = {
    success: true,
    parallelResults: [
      { task: 1, type: 'technical-analysis', result: technicalResult },
      { task: 2, type: 'business-analysis', result: businessResult },
    ],
    synthesis,
  };

  await sendUpdate('complete', { result: finalResult });

  await writer.close();
  writer.releaseLock();

  return finalResult;
}

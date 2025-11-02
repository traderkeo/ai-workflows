import { NextRequest } from 'next/server';
import {
  sequentialWorkflow,
  parallelWorkflow,
  conditionalWorkflow,
  retryWorkflow,
  complexWorkflow,
} from '@repo/workflows-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for long-running workflows

/**
 * Execute a durable workflow with progressive updates via ReadableStream
 */
export async function POST(request: NextRequest) {
  try {
    const { workflowType, model, input } = await request.json();

    // Validate workflowType is provided and is a valid type
    const validWorkflowTypes = ['sequential', 'parallel', 'conditional', 'retry', 'complex'];
    
    if (!workflowType) {
      return new Response(
        JSON.stringify({ error: 'Workflow type is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Strict validation - only allow exact matches
    if (!validWorkflowTypes.includes(workflowType)) {
      return new Response(
        JSON.stringify({ error: `Invalid workflow type: ${workflowType}. Must be one of: ${validWorkflowTypes.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Workflow API] Executing ONLY workflow type: ${workflowType}`);

    const selectedModel = model || 'gpt-4o-mini';

    // Create a readable stream for SSE
    const { readable, writable } = new TransformStream();

    // Execute workflow in background with writable stream
    // IMPORTANT: Only ONE workflow type will execute based on the switch statement
    (async () => {
      try {
        let workflowResult;

        // Use explicit if-else to ensure only one workflow executes
        if (workflowType === 'sequential') {
          console.log(`[Workflow API] Starting sequential workflow`);
          workflowResult = await sequentialWorkflow({
            input,
            model: selectedModel,
            writableStream: writable,
          });
        } else if (workflowType === 'parallel') {
          console.log(`[Workflow API] Starting parallel workflow`);
          workflowResult = await parallelWorkflow({
            input,
            model: selectedModel,
            writableStream: writable,
          });
        } else if (workflowType === 'conditional') {
          console.log(`[Workflow API] Starting conditional workflow`);
          workflowResult = await conditionalWorkflow({
            input,
            model: selectedModel,
            writableStream: writable,
          });
        } else if (workflowType === 'retry') {
          console.log(`[Workflow API] Starting retry workflow`);
          workflowResult = await retryWorkflow({
            input,
            model: selectedModel,
            writableStream: writable,
          });
        } else if (workflowType === 'complex') {
          console.log(`[Workflow API] Starting complex workflow`);
          workflowResult = await complexWorkflow({
            input,
            model: selectedModel,
            writableStream: writable,
          });
        } else {
          // This should never happen due to validation above, but adding as safety
          console.error(`[Workflow API] Unexpected workflow type: ${workflowType}`);
          const encoder = new TextEncoder();
          const writer = writable.getWriter();
          const errorMessage = `data: ${JSON.stringify({ type: 'error', data: { error: `Invalid workflow type: ${workflowType}` }, timestamp: Date.now() })}\n\n`;
          await writer.write(encoder.encode(errorMessage));
          await writer.close();
          writer.releaseLock();
          return;
        }

        console.log(`[Workflow API] Workflow ${workflowType} completed successfully`);

        // Workflow handles closing the stream itself, no action needed here
      } catch (error: any) {
        // Try to send error message, but handle case where stream might be locked
        try {
          const encoder = new TextEncoder();
          const writer = writable.getWriter();
          const errorMessage = `data: ${JSON.stringify({ type: 'error', data: { error: error.message || 'Internal server error' }, timestamp: Date.now() })}\n\n`;
          await writer.write(encoder.encode(errorMessage));
          await writer.close();
          writer.releaseLock();
        } catch (e: any) {
          // Stream might be locked or closed - that's okay, workflow should have handled it
          // Just log the error for debugging
          console.error('Could not send error message to client (stream may be locked):', e.message);
        }
      }
    })();

    // Return the readable stream to the client
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Workflow execution error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

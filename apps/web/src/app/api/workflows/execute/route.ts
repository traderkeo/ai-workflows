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

    if (!workflowType) {
      return new Response(
        JSON.stringify({ error: 'Workflow type is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const selectedModel = model || 'gpt-4o-mini';

    // Create a readable stream for SSE
    const { readable, writable } = new TransformStream();

    // Execute workflow in background with writable stream
    (async () => {
      try {
        let workflowResult;

        switch (workflowType) {
          case 'sequential':
            workflowResult = await sequentialWorkflow({
              input,
              model: selectedModel,
              writableStream: writable,
            });
            break;

          case 'parallel':
            workflowResult = await parallelWorkflow({
              input,
              model: selectedModel,
              writableStream: writable,
            });
            break;

          case 'conditional':
            workflowResult = await conditionalWorkflow({
              input,
              model: selectedModel,
              writableStream: writable,
            });
            break;

          case 'retry':
            workflowResult = await retryWorkflow({
              input,
              model: selectedModel,
              writableStream: writable,
            });
            break;

          case 'complex':
            workflowResult = await complexWorkflow({
              input,
              model: selectedModel,
              writableStream: writable,
            });
            break;

          default:
            const encoder = new TextEncoder();
            const writer = writable.getWriter();
            const errorMessage = `data: ${JSON.stringify({ type: 'error', data: { error: 'Invalid workflow type' }, timestamp: Date.now() })}\n\n`;
            await writer.write(encoder.encode(errorMessage));
            writer.close();
            writer.releaseLock();
            return;
        }

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

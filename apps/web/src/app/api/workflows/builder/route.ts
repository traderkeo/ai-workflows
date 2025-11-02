import { NextRequest } from 'next/server';
import { createWorkflow, WorkflowTemplates } from '@repo/workflows-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Execute a workflow built with the workflow builder
 */
export async function POST(request: NextRequest) {
  try {
    const { template, input, model, config } = await request.json();

    if (!template && !config) {
      return new Response(
        JSON.stringify({ error: 'Either template or config is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const selectedModel = model || 'gpt-4o-mini';

    // Create a writable stream for SSE
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Helper to send SSE updates
    const sendUpdate = async (type: string, data: any) => {
      const message = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
      await writer.write(encoder.encode(message));
    };

    // Execute workflow in the background
    (async () => {
      try {
        let workflow;

        // Use predefined template or custom config
        if (template && template in WorkflowTemplates) {
          await sendUpdate('start', { template, model: selectedModel });
          workflow = WorkflowTemplates[template as keyof typeof WorkflowTemplates](input, selectedModel);
        } else if (config) {
          // Build custom workflow from config
          await sendUpdate('start', { custom: true, model: selectedModel });
          workflow = createWorkflow();

          // TODO: Implement custom workflow building from config
          // This would parse the config and build the graph
        } else {
          throw new Error('Invalid template or config');
        }

        // Execute workflow with streaming context
        const results = await workflow.run({
          sendUpdate,
        });

        await sendUpdate('complete', { results });

        await writer.close();
      } catch (error: any) {
        console.error('Workflow builder execution error:', error);
        await sendUpdate('error', { error: error.message });
        await writer.close();
      }
    })();

    // Return the readable stream
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Workflow builder error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

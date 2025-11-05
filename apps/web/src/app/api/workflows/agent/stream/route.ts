import { NextRequest } from 'next/server';
import { generateWithToolsNode } from '@repo/ai-workers';
import { searchTool, calculatorTool, dateTimeTool } from '@repo/ai-workers';
import { tool } from 'ai';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, temperature, systemPrompt, messages, tools, customTools, reasoning } = await request.json();
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response('Missing prompt', { status: 400 });
    }

    const enabled: Record<string, any> = {};
    if (tools?.calculator) enabled.calculator = calculatorTool;
    if (tools?.search) enabled.search = searchTool;
    if (tools?.dateTime) enabled.datetime = dateTimeTool;

    // Simple custom tools scaffolding
    if (Array.isArray(customTools)) {
      for (const def of customTools) {
        if (!def?.name) continue;
        const anyTool: any = tool as any;
        enabled[def.name] = anyTool({
          description: def.description || 'Custom tool',
          parameters: z.any(),
          execute: async (args: any) => {
            const url = def.endpointUrl?.trim();
            if (url) {
              const allow = (process.env.TOOL_WEBHOOK_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean);
              const u = new URL(url);
              const origin = u.origin;
              if (allow.length && !allow.includes(origin) && !allow.includes(u.hostname)) {
                throw new Error(`Endpoint not allowed: ${origin}`);
              }
              const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tool: def.name, args }),
              });
              if (!resp.ok) {
                const txt = await resp.text();
                throw new Error(`Webhook ${resp.status}: ${txt}`);
              }
              const json = await resp.json().catch(() => ({}));
              return json;
            }
            return { ok: true, tool: def.name, args };
          },
        } as any);
      }
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let agg = '';
          await generateWithToolsNode({
            prompt,
            tools: enabled,
            model: model || 'gpt-4o-mini',
            temperature: typeof temperature === 'number' ? temperature : 0.7,
            systemPrompt: systemPrompt || '',
            messages: Array.isArray(messages) ? messages : [],
            maxSteps: 8,
            onStepFinish: (step: any) => {
              const payload: any = { step: step.stepType || 'tool', toolCalls: step.toolCalls || [] };
              // If the SDK/model surfaces any reasoning/thinking snippets, emit them
              if (reasoning) {
                const possible = (step.reasoning || step.thinking || step.thought || step.debug?.reasoning || step.delta?.reasoning);
                if (typeof possible === 'string' && possible.length) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ reasoningDelta: possible })}\n\n`));
                }
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
            },
          }).then((res: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, text: res.text, usage: res.usage })}\n\n`));
            controller.close();
          }).catch((err: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err?.message || 'Agent error' })}\n\n`));
            controller.close();
          });
        } catch (e: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: e?.message || 'Internal error' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Internal server error' }), { status: 500 });
  }
}

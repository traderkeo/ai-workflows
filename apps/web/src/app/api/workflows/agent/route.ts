import { NextRequest, NextResponse } from 'next/server';
import { generateWithToolsNode, searchTool, calculatorTool, dateTimeTool } from '@repo/ai-workers';
import { tool } from 'ai';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Execute a simple agent-like tool-calling turn using AI SDK v6-compatible tools layer.
 * Accepts built-in tool toggles and returns final text + tool call details.
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, model, temperature, systemPrompt, messages, tools, customTools } = await request.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const enabledTools: Record<string, any> = {};
    if (tools?.calculator) enabledTools.calculator = calculatorTool;
    if (tools?.search) enabledTools.search = searchTool;
    if (tools?.dateTime) enabledTools.datetime = dateTimeTool;

    // Simple custom tools scaffold
    if (Array.isArray(customTools)) {
      for (const def of customTools) {
        if (!def?.name) continue;
        const anyTool: any = tool as any;
        enabledTools[def.name] = anyTool({
          description: def.description || 'Custom tool',
          parameters: z.any(),
          execute: async (args: any) => {
            // Webhook execution if endpointUrl present and allowlisted
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
            // Fallback echo
            return { ok: true, tool: def.name, args };
          },
        } as any);
      }
    }

    const result = await generateWithToolsNode({
      prompt,
      tools: enabledTools,
      model: model || 'gpt-4o-mini',
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      systemPrompt: systemPrompt || '',
      messages: Array.isArray(messages) ? messages : [],
      maxSteps: 8,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Agent execution failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      text: result.text,
      toolCalls: result.toolCalls || [],
      usage: result.usage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

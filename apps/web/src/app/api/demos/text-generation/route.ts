import { NextRequest, NextResponse } from 'next/server';
import { generateTextNode, streamTextNode } from '@repo/ai-workers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { prompt, systemPrompt, model, temperature, maxTokens, stream } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Streaming response
    if (stream) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            await streamTextNode({
              prompt,
              systemPrompt: systemPrompt || '',
              temperature: temperature ?? 0.7,
              maxTokens: maxTokens ?? 2048,
              model: model || 'gpt-4o-mini',
              onChunk: (chunk: string) => {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
                );
              },
              onFinish: (result: any) => {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      done: true,
                      usage: result.usage,
                    })}\n\n`
                  )
                );
                controller.close();
              },
              onError: (error: Error) => {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ error: error.message })}\n\n`
                  )
                );
                controller.close();
              },
            });
          } catch (error: any) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: error.message })}\n\n`
              )
            );
            controller.close();
          }
        },
      });

      return new Response(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const result = await generateTextNode({
      prompt,
      systemPrompt: systemPrompt || '',
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens ?? 2048,
      model: model || 'gpt-4o-mini',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
    });
  } catch (error: any) {
    console.error('Text generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

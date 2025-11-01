import { NextRequest, NextResponse } from 'next/server';
import { generateStructuredDataNode, streamStructuredDataNode } from '@repo/ai-workers';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Predefined schemas
const schemas: Record<string, any> = {
  contact: z.object({
    name: z.string().describe('Full name'),
    email: z.string().email().describe('Email address'),
    phone: z.string().optional().describe('Phone number'),
    company: z.string().optional().describe('Company name'),
  }),
  product: z.object({
    name: z.string().describe('Product name'),
    price: z.number().describe('Price in USD'),
    category: z.string().describe('Product category'),
    features: z.array(z.string()).describe('Key features'),
    inStock: z.boolean().describe('Availability status'),
  }),
  event: z.object({
    title: z.string().describe('Event title'),
    date: z.string().describe('Event date'),
    location: z.string().describe('Event location'),
    attendees: z.number().describe('Expected number of attendees'),
    tags: z.array(z.string()).describe('Event tags/categories'),
  }),
  article: z.object({
    title: z.string().describe('Article title'),
    author: z.string().describe('Author name'),
    summary: z.string().describe('Brief summary'),
    keywords: z.array(z.string()).describe('Keywords/tags'),
    category: z.string().describe('Article category'),
    estimatedReadTime: z.number().describe('Reading time in minutes'),
  }),
};

export async function POST(request: NextRequest) {
  try {
    const { prompt, schemaType, model, stream, customSchema } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    let schema;
    let schemaName;

    if (customSchema) {
      // Use custom schema (would need to be validated/parsed)
      return NextResponse.json(
        { error: 'Custom schemas not yet implemented' },
        { status: 400 }
      );
    } else if (schemaType && schemas[schemaType]) {
      schema = schemas[schemaType];
      schemaName = schemaType;
    } else {
      return NextResponse.json(
        { error: 'Schema type is required' },
        { status: 400 }
      );
    }

    const selectedModel = model || 'gpt-4o-mini';

    // Streaming response
    if (stream) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            await streamStructuredDataNode({
              prompt,
              schema,
              schemaName,
              model: selectedModel,
              onPartial: (partialObject: any) => {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ partial: partialObject })}\n\n`)
                );
              },
              onFinish: (result: any) => {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      done: true,
                      object: result.object,
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
    const result = await generateStructuredDataNode({
      prompt,
      schema,
      schemaName,
      model: selectedModel,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      object: result.object,
      usage: result.usage,
      schema: schemaName,
    });
  } catch (error: any) {
    console.error('Structured data error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

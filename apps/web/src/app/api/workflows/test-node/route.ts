import { NextRequest, NextResponse } from 'next/server';
import {
  streamTextNode,
  generateStructuredDataNode,
  generateImageNode,
  editImageNode,
  createImageVariationNode,
  generateSpeechNode,
  transcribeAudioNode,
} from '@repo/ai-workers';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Execute a single workflow node (for testing and execution)
 */
export async function POST(request: NextRequest) {
  try {
    const { nodeType, config, input } = await request.json();

    if (!nodeType) {
      return NextResponse.json(
        { error: 'Node type is required' },
        { status: 400 }
      );
    }

    // Handle text generation node
    if (nodeType === 'text-generation') {
      const { prompt, model, temperature, maxTokens, systemPrompt } = config;

      // Resolve prompt - use input if prompt contains {{input}}
      let resolvedPrompt = prompt || '';
      if (input !== undefined && resolvedPrompt.includes('{{input}}')) {
        resolvedPrompt = resolvedPrompt.replace(/\{\{input\}\}/g, String(input));
      } else if (input !== undefined && !resolvedPrompt.trim()) {
        resolvedPrompt = String(input);
      }

      if (!resolvedPrompt.trim()) {
        return NextResponse.json(
          { error: 'Prompt is required' },
          { status: 400 }
        );
      }

      // Create a readable stream for SSE
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            await streamTextNode({
              prompt: resolvedPrompt,
              model: model || 'gpt-4o-mini',
              temperature: temperature ?? 0.7,
              maxTokens: maxTokens ?? 1000,
              systemPrompt: systemPrompt || '',
              onChunk: (chunk: string, fullText: string) => {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ chunk, fullText })}\n\n`)
                );
              },
              onFinish: (result: any) => {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      done: true,
                      text: result.text,
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

    // Handle structured data node
    if (nodeType === 'structured-data') {
      const { prompt, schema, schemaName, schemaDescription, model, temperature } = config;

      // Resolve prompt
      let resolvedPrompt = prompt || String(input || '');

      try {
        // If no schema is provided, we can't generate structured data
        // For now, return an error - in the future we could generate a schema from description
        if (!schema) {
          return NextResponse.json(
            { error: 'Schema is required for structured data generation. Please define a schema in the node configuration.' },
            { status: 400 }
          );
        }

        // Note: Properly handling Zod schemas requires them to be defined server-side
        // For now, if a schema object is provided, we'll try to use it
        // In a real implementation, schemas should be predefined or use a schema registry
        let zodSchema: z.ZodType;
        
        try {
          // Try to parse as JSON object and convert to Zod schema
          const schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema;
          
          // Create a simple Zod object schema from the JSON structure
          // This is a simplified approach - a full implementation would need proper Zod schema definitions
          const shape: Record<string, z.ZodTypeAny> = {};
          for (const [key, value] of Object.entries(schemaObj)) {
            if (typeof value === 'string') {
              shape[key] = z.string();
            } else if (typeof value === 'number') {
              shape[key] = z.number();
            } else if (typeof value === 'boolean') {
              shape[key] = z.boolean();
            } else if (Array.isArray(value)) {
              shape[key] = z.array(z.any());
            } else {
              shape[key] = z.any();
            }
          }
          
          zodSchema = z.object(shape);
        } catch (parseError) {
          return NextResponse.json(
            { error: 'Invalid schema format. Schema must be a valid JSON object.' },
            { status: 400 }
          );
        }

        const response = await generateStructuredDataNode({
          prompt: resolvedPrompt,
          schema: zodSchema,
          schemaName: schemaName || 'response',
          schemaDescription: schemaDescription || '',
          model: model || 'gpt-4o-mini',
          temperature: temperature ?? 0.7,
        });

        if (!response.success) {
          return NextResponse.json(
            { error: response.error || 'Structured data generation failed' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          object: response.object,
          usage: response.usage,
        });
      } catch (error: any) {
        console.error('Structured data generation error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal server error' },
          { status: 500 }
        );
      }
    }

    // Handle image generation node
    if (nodeType === 'image-generation') {
      const {
        prompt,
        model,
        size,
        quality,
        style,
        response_format,
        background,
        moderation,
        output_format,
        output_compression,
        n,
        stream,
        partial_images,
      } = config;

      if (!prompt?.trim()) {
        return NextResponse.json(
          { error: 'Prompt is required for image generation' },
          { status: 400 }
        );
      }

      try {
        const response = await generateImageNode({
          prompt,
          model: model || 'dall-e-3',
          size: size || '1024x1024',
          quality: quality || 'standard',
          style: style || 'natural',
          response_format: response_format || 'b64_json',
          background: background || 'auto',
          moderation: moderation || 'auto',
          output_format: output_format || 'png',
          output_compression: output_compression ?? 100,
          n: n ?? 1,
          stream: stream ?? false,
          partial_images: partial_images ?? 0,
        });

        if (!response.success) {
          return NextResponse.json(
            { error: response.error || 'Image generation failed' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          image: response.image,
          format: response.format,
          revisedPrompt: response.revisedPrompt,
          metadata: response.metadata,
        });
      } catch (error: any) {
        console.error('Image generation error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal server error' },
          { status: 500 }
        );
      }
    }

    // Handle image edit node
    if (nodeType === 'image-edit') {
      const { prompt, image, mask, model, size, n, response_format } = config;

      if (!prompt?.trim()) {
        return NextResponse.json(
          { error: 'Prompt is required for image editing' },
          { status: 400 }
        );
      }

      if (!image) {
        return NextResponse.json(
          { error: 'Image is required for image editing' },
          { status: 400 }
        );
      }

      try {
        const response = await editImageNode({
          prompt,
          image,
          mask,
          model: model || 'dall-e-2',
          size: size || '1024x1024',
          n: n ?? 1,
          response_format: response_format || 'b64_json',
        });

        if (!response.success) {
          return NextResponse.json(
            { error: response.error || 'Image editing failed' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          image: response.image,
          format: response.format,
          metadata: response.metadata,
        });
      } catch (error: any) {
        console.error('Image edit error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal server error' },
          { status: 500 }
        );
      }
    }

    // Handle image variation node
    if (nodeType === 'image-variation') {
      const { image, model, size, n, response_format } = config;

      if (!image) {
        return NextResponse.json(
          { error: 'Image is required for creating variations' },
          { status: 400 }
        );
      }

      console.log('[image-variation] Request:', {
        model: model || 'dall-e-2',
        size: size || '1024x1024',
        n: n ?? 1,
        response_format: response_format || 'b64_json',
        imageType: typeof image,
        imageLength: image?.length,
        imagePrefix: image?.substring(0, 50)
      });

      try {
        const response = await createImageVariationNode({
          image,
          model: model || 'dall-e-2', // Supports dall-e-2 and gpt-image-1
          size: size || '1024x1024',
          n: n ?? 1,
          response_format: response_format || 'b64_json',
        });

        console.log('[image-variation] Response:', {
          success: response.success,
          hasImage: !!response.image,
          error: response.error
        });

        if (!response.success) {
          return NextResponse.json(
            { error: response.error || 'Image variation failed' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          image: response.image,
          format: response.format,
          metadata: response.metadata,
        });
      } catch (error: any) {
        console.error('Image variation error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        return NextResponse.json(
          { error: error.message || 'Internal server error' },
          { status: 500 }
        );
      }
    }

    // Handle speech generation node
    if (nodeType === 'speech-generation') {
      const { text, model, voice, speed, responseFormat, instructions } = config;

      if (!text?.trim()) {
        return NextResponse.json(
          { error: 'Text is required for speech generation' },
          { status: 400 }
        );
      }

      try {
        const response = await generateSpeechNode({
          text,
          model: model || 'tts-1',
          voice: voice || 'alloy',
          speed: speed ?? 1.0,
          responseFormat: responseFormat || 'mp3',
          instructions,
        });

        if (!response.success) {
          return NextResponse.json(
            { error: response.error || 'Speech generation failed' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          audio: response.audio,
          format: response.format,
          metadata: response.metadata,
        });
      } catch (error: any) {
        console.error('Speech generation error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal server error' },
          { status: 500 }
        );
      }
    }

    // Handle audio transcription node
    if (nodeType === 'audio-transcription') {
      const { audio, model, language, prompt, temperature, timestampGranularities } = config;

      if (!audio) {
        return NextResponse.json(
          { error: 'Audio data is required for transcription' },
          { status: 400 }
        );
      }

      try {
        // Convert base64 audio to buffer if needed
        const audioBuffer = typeof audio === 'string'
          ? Buffer.from(audio, 'base64')
          : audio;

        const response = await transcribeAudioNode({
          audio: audioBuffer,
          model: model || 'whisper-1',
          language,
          prompt,
          temperature: temperature ?? 0,
          timestampGranularities: timestampGranularities || ['segment'],
        });

        if (!response.success) {
          return NextResponse.json(
            { error: response.error || 'Transcription failed' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          text: response.text,
          language: response.language,
          duration: response.duration,
          segments: response.segments,
          words: response.words,
          metadata: response.metadata,
        });
      } catch (error: any) {
        console.error('Transcription error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal server error' },
          { status: 500 }
        );
      }
    }

    // Add other node types here as needed
    return NextResponse.json(
      { error: `Node type ${nodeType} is not supported` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Node execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

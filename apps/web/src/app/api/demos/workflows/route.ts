import { NextRequest, NextResponse } from 'next/server';
import {
  chainNodes,
  parallelNodes,
  conditionalNode,
  retryNode,
  generateTextNode,
  generateStructuredDataNode,
  WorkflowContext,
} from '@repo/ai-workers';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { workflowType, input } = await request.json();

    if (!workflowType) {
      return NextResponse.json(
        { error: 'Workflow type is required' },
        { status: 400 }
      );
    }

    const context = new WorkflowContext();
    let result;

    switch (workflowType) {
      case 'sequential': {
        // Sequential chain: Summarize -> Extract Keywords -> Generate Title
        const nodes = [
          // Step 1: Summarize
          (inputText: string, ctx: WorkflowContext) =>
            generateTextNode({
              prompt: `Summarize this in 2 sentences: ${inputText}`,
              model: 'gpt-4o-mini',
              temperature: 0.3,
              context: ctx,
            }),

          // Step 2: Extract keywords
          (summary: any, ctx: WorkflowContext) =>
            generateStructuredDataNode({
              prompt: `Extract keywords from: ${summary.text}`,
              schema: z.object({
                keywords: z.array(z.string()).describe('Important keywords'),
                category: z.string().describe('Content category'),
              }),
              model: 'gpt-4o-mini',
              context: ctx,
            }),

          // Step 3: Generate title
          (keywords: any, ctx: WorkflowContext) =>
            generateTextNode({
              prompt: `Create a catchy title using these keywords: ${JSON.stringify(keywords.object?.keywords || [])}`,
              model: 'gpt-4o-mini',
              temperature: 0.8,
              context: ctx,
            }),
        ];

        result = await chainNodes(nodes, input, context);
        break;
      }

      case 'parallel': {
        // Parallel execution: Multiple translations at once
        const tasks = [
          {
            node: (text: string, ctx: WorkflowContext) =>
              generateTextNode({
                prompt: `Translate to French: ${text}`,
                model: 'gpt-4o-mini',
                context: ctx,
              }),
            input,
          },
          {
            node: (text: string, ctx: WorkflowContext) =>
              generateTextNode({
                prompt: `Translate to Spanish: ${text}`,
                model: 'gpt-4o-mini',
                context: ctx,
              }),
            input,
          },
          {
            node: (text: string, ctx: WorkflowContext) =>
              generateTextNode({
                prompt: `Translate to German: ${text}`,
                model: 'gpt-4o-mini',
                context: ctx,
              }),
            input,
          },
        ];

        result = await parallelNodes(tasks, context);
        break;
      }

      case 'conditional': {
        // Conditional: Long text -> summarize, Short text -> expand
        const predicate = (text: string) => text.length > 100;

        const longTextBranch = (text: string, ctx: WorkflowContext) =>
          generateTextNode({
            prompt: `Summarize this text concisely: ${text}`,
            model: 'gpt-4o-mini',
            context: ctx,
          });

        const shortTextBranch = (text: string, ctx: WorkflowContext) =>
          generateTextNode({
            prompt: `Expand on this text with more details: ${text}`,
            model: 'gpt-4o-mini',
            context: ctx,
          });

        result = await conditionalNode(
          predicate,
          longTextBranch,
          shortTextBranch,
          input,
          context
        );
        break;
      }

      case 'retry': {
        // Retry with exponential backoff
        const unstableNode = (text: string, ctx: WorkflowContext) =>
          generateTextNode({
            prompt: text,
            model: 'gpt-4o-mini',
            context: ctx,
          });

        result = await retryNode(unstableNode, input, 3, 1000, context);
        break;
      }

      case 'complex': {
        // Complex workflow: Parallel -> Conditional -> Chain
        // Step 1: Generate multiple perspectives in parallel
        const perspectiveTasks = [
          {
            node: (text: string, ctx: WorkflowContext) =>
              generateTextNode({
                prompt: `Analyze this from a technical perspective: ${text}`,
                model: 'gpt-4o-mini',
                context: ctx,
              }),
            input,
          },
          {
            node: (text: string, ctx: WorkflowContext) =>
              generateTextNode({
                prompt: `Analyze this from a business perspective: ${text}`,
                model: 'gpt-4o-mini',
                context: ctx,
              }),
            input,
          },
        ];

        const parallelResult = await parallelNodes(perspectiveTasks, context);

        // Step 2: Combine and synthesize
        if (parallelResult.success) {
          const combined = parallelResult.results.map((r: any) => r.text).join('\n\n');

          const finalResult = await generateTextNode({
            prompt: `Synthesize these perspectives into a balanced conclusion:\n\n${combined}`,
            model: 'gpt-4o-mini',
            context,
          });

          result = {
            success: true,
            parallelResults: parallelResult.results,
            synthesis: finalResult,
            metadata: context.getMetadata(),
          };
        } else {
          result = parallelResult;
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid workflow type' },
          { status: 400 }
        );
    }

    // Add context metadata to result
    const metadata = context.getMetadata();

    return NextResponse.json({
      success: result.success,
      result,
      metadata,
    });
  } catch (error: any) {
    console.error('Workflow error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  generateEmbeddingNode,
  generateEmbeddingsBatchNode,
  semanticSearchNode,
  cosineSimilarity,
} from '@repo/ai-workers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { action, text, texts, query, documents, topK } = await request.json();

    switch (action) {
      case 'single-embedding': {
        if (!text) {
          return NextResponse.json(
            { error: 'Text is required for single embedding' },
            { status: 400 }
          );
        }

        const result = await generateEmbeddingNode({
          text,
          model: 'text-embedding-3-small',
        });

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 500 }
          );
        }

        return NextResponse.json({
          embedding: result.embedding,
          dimensions: result.dimensions,
          usage: result.usage,
          preview: result.embedding?.slice(0, 10) ?? [], // First 10 values
        });
      }

      case 'batch-embeddings': {
        if (!texts || !Array.isArray(texts) || texts.length === 0) {
          return NextResponse.json(
            { error: 'Texts array is required for batch embeddings' },
            { status: 400 }
          );
        }

        const result = await generateEmbeddingsBatchNode({
          texts,
          model: 'text-embedding-3-small',
        });

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 500 }
          );
        }

        return NextResponse.json({
          embeddings: result.embeddings,
          count: result.count,
          dimensions: result.dimensions,
          usage: result.usage,
          previews: result.embeddings?.map(emb => emb.slice(0, 5)) ?? [], // First 5 values each
        });
      }

      case 'semantic-search': {
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required for semantic search' },
            { status: 400 }
          );
        }

        if (!documents || !Array.isArray(documents) || documents.length === 0) {
          return NextResponse.json(
            { error: 'Documents array is required for semantic search' },
            { status: 400 }
          );
        }

        const result = await semanticSearchNode({
          query,
          documents,
          topK: topK || 5,
          model: 'text-embedding-3-small',
        });

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 500 }
          );
        }

        return NextResponse.json({
          query: result.query,
          results: result.results,
          count: result.count,
        });
      }

      case 'similarity': {
        const { embedding1, embedding2 } = await request.json();

        if (!embedding1 || !embedding2) {
          return NextResponse.json(
            { error: 'Two embeddings are required for similarity calculation' },
            { status: 400 }
          );
        }

        const similarity = cosineSimilarity(embedding1, embedding2);

        return NextResponse.json({
          similarity,
          interpretation:
            similarity > 0.8
              ? 'Very similar'
              : similarity > 0.6
              ? 'Similar'
              : similarity > 0.4
              ? 'Somewhat similar'
              : 'Not similar',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: single-embedding, batch-embeddings, semantic-search, or similarity' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Embeddings error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

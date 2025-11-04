import { NextRequest, NextResponse } from 'next/server';
import { generateEmbeddingsBatchNode } from '@repo/ai-workers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { texts, model, dimensions } = await request.json();
    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: 'texts must be a non-empty array' }, { status: 400 });
    }

    const res = await generateEmbeddingsBatchNode({ texts, model: model || 'text-embedding-3-small', dimensions: dimensions ?? null });
    if (!res.success) {
      return NextResponse.json({ error: res.error || 'Embedding generation failed' }, { status: 500 });
    }
    return NextResponse.json({ success: true, embeddings: res.embeddings, dimensions: res.dimensions, usage: res.usage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}


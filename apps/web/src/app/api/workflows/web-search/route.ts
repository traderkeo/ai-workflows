import { NextRequest, NextResponse } from 'next/server';
import { webSearchNode } from '@repo/ai-workers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { query, model, filters, userLocation, externalWebAccess, includeSources, reasoning, reasoningEffort, toolChoice } = await request.json();
    if (!query || !String(query).trim()) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    // Normalize reasoning
    const reasoningParam = reasoning ?? (reasoningEffort ? { effort: reasoningEffort } : null);

    const res = await webSearchNode({
      query,
      model: model || 'gpt-4o-mini',
      filters: filters || null,
      userLocation: userLocation || null,
      externalWebAccess: externalWebAccess !== false,
      includeSources: !!includeSources,
      reasoning: reasoningParam,
      toolChoice: toolChoice || 'auto',
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error || 'Web search failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, text: res.text, citations: res.citations, sources: res.sources, metadata: res.metadata });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  webSearchNode,
  simpleWebSearch,
  domainFilteredSearch,
  locationAwareSearch,
} from '@repo/ai-workers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const {
      query,
      mode,
      domains,
      location,
      externalWebAccess,
      includeSources,
    } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    let result;

    switch (mode) {
      case 'domain-filtered':
        if (!domains || domains.length === 0) {
          return NextResponse.json(
            { error: 'Domains required for domain-filtered mode' },
            { status: 400 }
          );
        }
        result = await domainFilteredSearch({
          query,
          domains,
          externalWebAccess,
          includeSources,
        });
        break;

      case 'location-aware':
        if (!location) {
          return NextResponse.json(
            { error: 'Location required for location-aware mode' },
            { status: 400 }
          );
        }
        result = await locationAwareSearch({
          query,
          location,
          externalWebAccess,
          includeSources,
        });
        break;

      case 'advanced':
        result = await webSearchNode({
          query,
          filters: domains?.length > 0 ? { allowedDomains: domains } : undefined,
          userLocation: location,
          externalWebAccess,
          includeSources,
          model: 'gpt-4o-mini',
        });
        break;

      default:
        result = await simpleWebSearch(query, {
          externalWebAccess,
          includeSources,
        });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      text: result.text,
      citations: result.citations,
      sources: result.sources,
      searchCalls: result.searchCalls,
      metadata: result.metadata,
    });
  } catch (error: any) {
    console.error('Web search error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

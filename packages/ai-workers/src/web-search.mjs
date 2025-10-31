/**
 * OpenAI Web Search Module
 *
 * Provides web search capabilities using OpenAI's Responses API
 * Based on: https://platform.openai.com/docs/guides/tools-web-search
 *
 * @module web-search
 */

import OpenAI from 'openai';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  model: 'gpt-4o-mini', // Default model that supports web search
  maxRetries: 2,
  timeout: 60000, // 60 seconds for web search (can be longer)
};

// ============================================================================
// Web Search Functions
// ============================================================================

/**
 * Perform a web search using OpenAI's Responses API
 *
 * @param {Object} params - Search parameters
 * @param {string} params.query - The search query/question
 * @param {string} [params.model] - Model to use (default: gpt-4o-mini)
 * @param {Object} [params.filters] - Domain filtering options
 * @param {string[]} [params.filters.allowedDomains] - Limit to specific domains (max 20)
 * @param {Object} [params.userLocation] - User location for geo-refined results
 * @param {string} [params.userLocation.country] - ISO country code (e.g., 'US')
 * @param {string} [params.userLocation.city] - City name (e.g., 'New York')
 * @param {string} [params.userLocation.region] - Region/state (e.g., 'New York')
 * @param {string} [params.userLocation.timezone] - IANA timezone (e.g., 'America/New_York')
 * @param {boolean} [params.externalWebAccess] - Enable live internet access (default: true)
 * @param {boolean} [params.includeSources] - Include all sources in response (default: false)
 * @param {Object} [params.context] - Workflow context for tracking
 * @param {AbortSignal} [params.abortSignal] - Abort signal for cancellation
 * @returns {Promise<Object>} Search result with text, citations, and metadata
 */
export async function webSearchNode({
  query,
  model = DEFAULT_CONFIG.model,
  filters = null,
  userLocation = null,
  externalWebAccess = true,
  includeSources = false,
  context = null,
  abortSignal = null,
}) {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build web search tool configuration
    const webSearchTool = {
      type: 'web_search',
      external_web_access: externalWebAccess,
    };

    // Add domain filters if provided
    if (filters?.allowedDomains && filters.allowedDomains.length > 0) {
      webSearchTool.filters = {
        allowed_domains: filters.allowedDomains.slice(0, 20), // Max 20 domains
      };
    }

    // Add user location if provided
    if (userLocation) {
      webSearchTool.user_location = {
        type: 'approximate',
        ...userLocation,
      };
    }

    // Build request options
    const requestOptions = {
      model,
      tools: [webSearchTool],
      tool_choice: 'auto',
      input: query,
    };

    // Include sources if requested
    if (includeSources) {
      requestOptions.include = ['web_search_call.action.sources'];
    }

    // Add abort signal if provided
    if (abortSignal) {
      requestOptions.signal = abortSignal;
    }

    // Make the API request
    const response = await client.responses.create(requestOptions);

    // Extract data from response
    const outputText = response.output_text || '';
    const citations = [];
    const sources = [];
    let searchCalls = [];

    // Parse response items
    if (response.output && Array.isArray(response.output)) {
      for (const item of response.output) {
        // Extract web search calls
        if (item.type === 'web_search_call') {
          searchCalls.push({
            id: item.id,
            status: item.status,
            action: item.action || {},
          });

          // Extract sources if available
          if (item.action?.sources) {
            sources.push(...item.action.sources);
          }
        }

        // Extract citations from message content
        if (item.type === 'message' && item.content) {
          for (const content of item.content) {
            if (content.type === 'output_text' && content.annotations) {
              for (const annotation of content.annotations) {
                if (annotation.type === 'url_citation') {
                  citations.push({
                    url: annotation.url,
                    title: annotation.title,
                    startIndex: annotation.start_index,
                    endIndex: annotation.end_index,
                  });
                }
              }
            }
          }
        }
      }
    }

    // Update context if provided
    if (context) {
      context.incrementNodeExecutions();
      // Note: Responses API doesn't return token usage in the same format
      // You may need to estimate or track separately
    }

    return {
      success: true,
      text: outputText,
      citations,
      sources: includeSources ? sources : undefined,
      searchCalls,
      metadata: {
        model,
        timestamp: Date.now(),
        citationCount: citations.length,
        sourceCount: sources.length,
        searchCallCount: searchCalls.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      text: null,
      citations: [],
      sources: [],
      searchCalls: [],
      metadata: {
        model,
        timestamp: Date.now(),
        errorType: error.constructor.name,
      },
    };
  }
}

/**
 * Perform a simple web search with just a query
 * Convenience function for basic searches
 *
 * @param {string} query - The search query
 * @param {Object} [options] - Optional configuration
 * @returns {Promise<Object>} Search result
 */
export async function simpleWebSearch(query, options = {}) {
  return webSearchNode({
    query,
    ...options,
  });
}

/**
 * Perform a domain-filtered web search
 * Only searches within specified domains
 *
 * @param {Object} params - Search parameters
 * @param {string} params.query - The search query
 * @param {string[]} params.domains - List of domains to search (max 20)
 * @param {Object} [params.options] - Additional options
 * @returns {Promise<Object>} Search result
 */
export async function domainFilteredSearch({ query, domains, ...options }) {
  return webSearchNode({
    query,
    filters: {
      allowedDomains: domains,
    },
    ...options,
  });
}

/**
 * Perform a location-aware web search
 * Results are refined based on user location
 *
 * @param {Object} params - Search parameters
 * @param {string} params.query - The search query
 * @param {Object} params.location - User location
 * @param {string} [params.location.country] - ISO country code
 * @param {string} [params.location.city] - City name
 * @param {string} [params.location.region] - Region/state
 * @param {string} [params.location.timezone] - IANA timezone
 * @param {Object} [params.options] - Additional options
 * @returns {Promise<Object>} Search result
 */
export async function locationAwareSearch({ query, location, ...options }) {
  return webSearchNode({
    query,
    userLocation: location,
    ...options,
  });
}

/**
 * Perform a cached-only web search (no live internet access)
 * Uses only cached/indexed results
 *
 * @param {string} query - The search query
 * @param {Object} [options] - Optional configuration
 * @returns {Promise<Object>} Search result
 */
export async function cachedWebSearch(query, options = {}) {
  return webSearchNode({
    query,
    externalWebAccess: false,
    ...options,
  });
}

/**
 * Perform a web search with full source information
 * Returns all URLs consulted during the search
 *
 * @param {string} query - The search query
 * @param {Object} [options] - Optional configuration
 * @returns {Promise<Object>} Search result with sources
 */
export async function webSearchWithSources(query, options = {}) {
  return webSearchNode({
    query,
    includeSources: true,
    ...options,
  });
}

/**
 * Format citations for display
 * Converts citation objects to readable format
 *
 * @param {Array} citations - Array of citation objects
 * @returns {string} Formatted citations
 */
export function formatCitations(citations) {
  if (!citations || citations.length === 0) {
    return 'No citations available.';
  }

  return citations
    .map((citation, index) => {
      const { title, url } = citation;
      return `[${index + 1}] ${title}\n    ${url}`;
    })
    .join('\n\n');
}

/**
 * Extract unique domains from citations
 *
 * @param {Array} citations - Array of citation objects
 * @returns {Array<string>} List of unique domains
 */
export function extractDomains(citations) {
  if (!citations || citations.length === 0) {
    return [];
  }

  const domains = new Set();

  citations.forEach(citation => {
    try {
      const url = new URL(citation.url);
      domains.add(url.hostname);
    } catch (error) {
      // Skip invalid URLs
    }
  });

  return Array.from(domains);
}

/**
 * Create citation links in markdown format
 *
 * @param {string} text - The text with citations
 * @param {Array} citations - Array of citation objects
 * @returns {string} Text with markdown citation links
 */
export function createMarkdownCitations(text, citations) {
  if (!citations || citations.length === 0) {
    return text;
  }

  let result = text;

  // Add citation references
  const citationList = citations
    .map((citation, index) => `[^${index + 1}]: [${citation.title}](${citation.url})`)
    .join('\n');

  result += '\n\n## References\n\n' + citationList;

  return result;
}

// ============================================================================
// Export all functionality
// ============================================================================

export default {
  webSearchNode,
  simpleWebSearch,
  domainFilteredSearch,
  locationAwareSearch,
  cachedWebSearch,
  webSearchWithSources,
  formatCitations,
  extractDomains,
  createMarkdownCitations,
};

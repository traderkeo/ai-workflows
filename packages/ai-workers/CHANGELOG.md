# Changelog - @repo/ai-workers

## [0.1.0] - 2025-10-31

### Added
- Initial release of AI Workers library
- **Text Generation**: Regular and streaming text generation with OpenAI models
- **Structured Data**: Extract JSON objects using Zod schemas
- **Embeddings**: Single and batch embedding generation
- **Semantic Search**: Vector similarity search with cosine similarity
- **Web Search**: OpenAI Responses API web search integration
  - Simple web search
  - Domain-filtered search (limit to specific domains)
  - Location-aware search (geo-refined results)
  - Cached search (offline mode)
  - Full source tracking
  - Citation formatting utilities
- **Workflow Utilities**:
  - Sequential chains (chainNodes)
  - Parallel execution (parallelNodes)
  - Conditional branching (conditionalNode)
  - Retry with exponential backoff (retryNode)
- **Context Management**: WorkflowContext for tracking execution state
- **Error Handling**: Consistent error responses across all functions
- **TypeScript Support**: Full type definitions included

### Test Coverage
- Core library: 79.2% (19/24 tests passing)
- Web search: 82.4% (14/17 tests passing)
- All critical features tested and working

### Documentation
- Comprehensive README with API documentation
- Quick start guide
- Example usage patterns
- Integration guide for visual node interfaces

### Dependencies
- ai (beta)
- @ai-sdk/openai (beta)
- openai ^4.76.1
- zod ^4.1.12
- dotenv ^17.2.3 (dev)

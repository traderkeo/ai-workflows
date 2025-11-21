/**
 * AI Provider Configuration
 *
 * Supports multiple AI providers with model capabilities:
 * - OpenAI (GPT, Embeddings, Images, Audio)
 * - Anthropic (Claude)
 * - Google (Gemini)
 */

import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

// Detect Together.ai model IDs (OpenAI-compatible API) - they typically contain a slash
const isTogetherModelId = (id) => typeof id === 'string' && id.includes('/');

// ============================================================================
// Model Capabilities
// ============================================================================

/**
 * Model capability flags
 */
export const ModelCapabilities = {
  TEXT_GENERATION: 'text-generation',
  OBJECT_GENERATION: 'object-generation',
  TOOL_USAGE: 'tool-usage',
  IMAGE_INPUT: 'image-input',
  AUDIO_INPUT: 'audio-input',
  WEB_SEARCH: 'web-search',
  STREAMING: 'streaming',
  EMBEDDINGS: 'embeddings',
  IMAGE_GENERATION: 'image-generation',
  AUDIO_GENERATION: 'audio-generation',
  TRANSCRIPTION: 'transcription',
};

// ============================================================================
// OpenAI Models
// ============================================================================

/**
 * OpenAI Chat Models (GPT)
 */
export const OPENAI_CHAT_MODELS = {
  // GPT-4o Series
  'gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    description: 'Most capable multimodal model',
    maxTokens: 16384,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.STREAMING,
    ],
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    name: 'GPT-4o Mini',
    description: 'Fast and affordable multimodal model',
    maxTokens: 16384,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.STREAMING,
    ],
  },

  // GPT-4 Turbo Series
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    provider: 'openai',
    name: 'GPT-4 Turbo',
    description: 'Previous generation multimodal model',
    maxTokens: 4096,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.STREAMING,
    ],
  },

  // GPT-4.1 Series
  'gpt-4.1': {
    id: 'gpt-4.1',
    provider: 'openai',
    name: 'GPT-4.1',
    description: 'Enhanced GPT-4 model',
    maxTokens: 4096,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.STREAMING,
    ],
  },
  'gpt-4.1-mini': {
    id: 'gpt-4.1-mini',
    provider: 'openai',
    name: 'GPT-4.1 Mini',
    description: 'Smaller, faster GPT-4.1',
    maxTokens: 4096,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.STREAMING,
    ],
  },
  'gpt-4.1-nano': {
    id: 'gpt-4.1-nano',
    provider: 'openai',
    name: 'GPT-4.1 Nano',
    description: 'Ultra-fast and efficient',
    maxTokens: 4096,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.STREAMING,
    ],
  },

  // GPT-5 Series
  'gpt-5-pro': {
    id: 'gpt-5-pro',
    provider: 'openai',
    name: 'GPT-5 Pro',
    description: 'Next-generation professional model',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.STREAMING,
    ],
  },
  'gpt-5': {
    id: 'gpt-5',
    provider: 'openai',
    name: 'GPT-5',
    description: 'Next-generation base model',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.STREAMING,
    ],
  },
  'gpt-5-mini': {
    id: 'gpt-5-mini',
    provider: 'openai',
    name: 'GPT-5 Mini',
    description: 'Next-generation efficient model',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.STREAMING,
    ],
  },
  'gpt-5-nano': {
    id: 'gpt-5-nano',
    provider: 'openai',
    name: 'GPT-5 Nano',
    description: 'Next-generation ultra-fast model',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.STREAMING,
    ],
  },
  'gpt-5-codex': {
    id: 'gpt-5-codex',
    provider: 'openai',
    name: 'GPT-5 Codex',
    description: 'Code-specialized GPT-5',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.STREAMING,
    ],
  },
};

/**
 * OpenAI Embedding Models
 */
export const OPENAI_EMBEDDING_MODELS = {
  'text-embedding-3-large': {
    id: 'text-embedding-3-large',
    provider: 'openai',
    name: 'Text Embedding 3 Large',
    description: 'Most capable embedding model (3072 dimensions)',
    dimensions: 3072,
    capabilities: [ModelCapabilities.EMBEDDINGS],
  },
  'text-embedding-3-small': {
    id: 'text-embedding-3-small',
    provider: 'openai',
    name: 'Text Embedding 3 Small',
    description: 'Efficient embedding model (1536 dimensions)',
    dimensions: 1536,
    capabilities: [ModelCapabilities.EMBEDDINGS],
  },
  'text-embedding-ada-002': {
    id: 'text-embedding-ada-002',
    provider: 'openai',
    name: 'Ada Embedding 002',
    description: 'Legacy embedding model (1536 dimensions)',
    dimensions: 1536,
    capabilities: [ModelCapabilities.EMBEDDINGS],
  },
};

/**
 * OpenAI Image Models
 */
export const OPENAI_IMAGE_MODELS = {
  'dall-e-3': {
    id: 'dall-e-3',
    provider: 'openai',
    name: 'DALL·E 3',
    description: 'Most capable image generation model',
    sizes: ['1024x1024', '1792x1024', '1024x1792'],
    capabilities: [ModelCapabilities.IMAGE_GENERATION],
  },
  'dall-e-2': {
    id: 'dall-e-2',
    provider: 'openai',
    name: 'DALL·E 2',
    description: 'Fast image generation',
    sizes: ['256x256', '512x512', '1024x1024'],
    capabilities: [ModelCapabilities.IMAGE_GENERATION],
  },
};

/**
 * OpenAI Audio/Speech Models
 */
export const OPENAI_AUDIO_MODELS = {
  // Text-to-Speech
  'tts-1': {
    id: 'tts-1',
    provider: 'openai',
    name: 'TTS 1',
    description: 'Fast text-to-speech',
    capabilities: [ModelCapabilities.AUDIO_GENERATION],
  },
  'tts-1-hd': {
    id: 'tts-1-hd',
    provider: 'openai',
    name: 'TTS 1 HD',
    description: 'High quality text-to-speech',
    capabilities: [ModelCapabilities.AUDIO_GENERATION],
  },

  // Speech-to-Text
  'whisper-1': {
    id: 'whisper-1',
    provider: 'openai',
    name: 'Whisper',
    description: 'Speech recognition and transcription',
    capabilities: [ModelCapabilities.TRANSCRIPTION],
  },
};

// ============================================================================
// Together.ai Models (curated)
// ============================================================================

// Note: Together accepts many model IDs dynamically. We include popular image models with
// documented parameter nuances to aid UI and validation. Dynamic IDs are also supported
// via isTogetherModelId() + getModelInfo fallback below.
export const TOGETHER_MODELS = {
  // FLUX.1 Schnell — fast image generation
  'black-forest-labs/FLUX.1-schnell': {
    id: 'black-forest-labs/FLUX.1-schnell',
    provider: 'together',
    name: 'FLUX.1 Schnell',
    description: 'Fast image generation (steps 1–50). Supports variations (n), seed, negative_prompt.',
    capabilities: [ModelCapabilities.IMAGE_GENERATION],
    parameters: {
      widthHeight: true,
      aspectRatio: true, // models may accept aspect_ratio instead of width/height
      steps: [1, 50],
      supportsImageURL: false,
      responseFormat: ['url', 'base64'],
    },
  },

  // FLUX.1 Kontext Pro — in-context image generation with reference image
  'black-forest-labs/FLUX.1-kontext-pro': {
    id: 'black-forest-labs/FLUX.1-kontext-pro',
    provider: 'together',
    name: 'FLUX.1 Kontext Pro',
    description: 'In-context generation; accepts image_url reference guiding output.',
    capabilities: [ModelCapabilities.IMAGE_GENERATION],
    parameters: {
      widthHeight: true,
      aspectRatio: true,
      supportsImageURL: true,
      responseFormat: ['url', 'base64'],
    },
  },

  // FLUX.1 Depth — tool model for depth-based guidance / editing
  'black-forest-labs/FLUX.1-depth': {
    id: 'black-forest-labs/FLUX.1-depth',
    provider: 'together',
    name: 'FLUX.1 Depth',
    description: 'Depth-guided transformation; accepts image_url reference.',
    capabilities: [ModelCapabilities.IMAGE_GENERATION],
    parameters: {
      widthHeight: true,
      steps: [1, 50],
      supportsImageURL: true,
      responseFormat: ['url', 'base64'],
    },
  },

  // FLUX.1 Dev LoRA — LoRA-enabled image generation
  'black-forest-labs/FLUX.1-dev-lora': {
    id: 'black-forest-labs/FLUX.1-dev-lora',
    provider: 'together',
    name: 'FLUX.1 Dev LoRA',
    description: 'High-speed endpoint with LoRA support (image_loras).',
    capabilities: [ModelCapabilities.IMAGE_GENERATION],
    parameters: {
      widthHeight: true,
      steps: [1, 50],
      supportsImageLoras: true,
      responseFormat: ['url', 'base64'],
    },
  },
};

/**
 * All OpenAI Models
 */
export const OPENAI_MODELS = {
  ...OPENAI_CHAT_MODELS,
  ...OPENAI_EMBEDDING_MODELS,
  ...OPENAI_IMAGE_MODELS,
  ...OPENAI_AUDIO_MODELS,
};

// ============================================================================
// Anthropic (Claude) Models
// ============================================================================

export const ANTHROPIC_MODELS = {
  // Claude 4 Series (with date suffixes - actual API model IDs)
  'claude-sonnet-4-5-20250929': {
    id: 'claude-sonnet-4-5-20250929',
    provider: 'anthropic',
    name: 'Claude Sonnet 4.5',
    description: 'Our smartest model for complex agents and coding',
    maxTokens: 65536, // 64K tokens max output
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },
  'claude-haiku-4-5-20251001': {
    id: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
    name: 'Claude Haiku 4.5',
    description: 'Our fastest model with near-frontier intelligence',
    maxTokens: 65536, // 64K tokens max output
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },
  'claude-opus-4-1-20250805': {
    id: 'claude-opus-4-1-20250805',
    provider: 'anthropic',
    name: 'Claude Opus 4.1',
    description: 'Exceptional model for specialized reasoning tasks',
    maxTokens: 32768, // 32K tokens max output
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },
  // Claude 4 Series (aliases)
  'claude-sonnet-4-5': {
    id: 'claude-sonnet-4-5-20250929',
    provider: 'anthropic',
    name: 'Claude Sonnet 4.5',
    description: 'Our smartest model for complex agents and coding',
    maxTokens: 65536,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },
  'claude-haiku-4-5': {
    id: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
    name: 'Claude Haiku 4.5',
    description: 'Our fastest model with near-frontier intelligence',
    maxTokens: 65536,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },
  'claude-opus-4-1': {
    id: 'claude-opus-4-1-20250805',
    provider: 'anthropic',
    name: 'Claude Opus 4.1',
    description: 'Exceptional model for specialized reasoning tasks',
    maxTokens: 32768,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },
  'claude-opus-4-0': {
    id: 'claude-opus-4-0',
    provider: 'anthropic',
    name: 'Claude Opus 4.0',
    description: 'Claude 4 base model',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },
  'claude-sonnet-4-0': {
    id: 'claude-sonnet-4-0',
    provider: 'anthropic',
    name: 'Claude Sonnet 4.0',
    description: 'Claude 4 balanced model',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },
};

// ============================================================================
// Google (Gemini) Models
// ============================================================================

export const GOOGLE_MODELS = {
  // Gemini 2.5 Series (Latest)
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    provider: 'google',
    name: 'Gemini 2.5 Pro',
    description: 'Latest and most capable Gemini model',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    provider: 'google',
    name: 'Gemini 2.5 Flash',
    description: 'Fast and efficient Gemini 2.5',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },
  'gemini-2.5-flash-lite': {
    id: 'gemini-2.5-flash-lite',
    provider: 'google',
    name: 'Gemini 2.5 Flash Lite',
    description: 'Ultra-fast lightweight model',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },
  'gemini-2.5-flash-lite-preview-06-17': {
    id: 'gemini-2.5-flash-lite-preview-06-17',
    provider: 'google',
    name: 'Gemini 2.5 Flash Lite Preview',
    description: 'Preview of ultra-fast model (June 17)',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },

  // Gemini 2.0 Series
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    provider: 'google',
    name: 'Gemini 2.0 Flash',
    description: 'Multimodal model with native tool use',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },

  // Gemini 1.5 Series
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    provider: 'google',
    name: 'Gemini 1.5 Pro',
    description: 'Most capable Gemini 1.5 with large context',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },
  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    provider: 'google',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and versatile performance',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },
  'gemini-1.5-flash-8b': {
    id: 'gemini-1.5-flash-8b',
    provider: 'google',
    name: 'Gemini 1.5 Flash 8B',
    description: 'Smallest and fastest Gemini model',
    maxTokens: 8192,
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.OBJECT_GENERATION,
      ModelCapabilities.TOOL_USAGE,
      ModelCapabilities.IMAGE_INPUT,
      ModelCapabilities.WEB_SEARCH,
      ModelCapabilities.STREAMING,
    ],
  },
};

// ============================================================================
// Combined Models
// ============================================================================

/**
 * All supported models across all providers
 */
export const SUPPORTED_MODELS = {
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
  ...GOOGLE_MODELS,
  ...TOGETHER_MODELS,
};

/**
 * Get models that support a specific capability
 */
export function getModelsByCapability(capability) {
  return Object.values(SUPPORTED_MODELS).filter(model =>
    model.capabilities?.includes(capability)
  );
}

/**
 * Check if a model supports a specific capability
 */
export function modelSupports(modelId, capability) {
  const model = SUPPORTED_MODELS[modelId];
  return model?.capabilities?.includes(capability) ?? false;
}

/**
 * Get model information by ID
 * @param {string} modelId - Model identifier
 * @returns {Object} Model information
 */
export function getModelInfo(modelId) {
  // Dynamic Together.ai model descriptor if the id looks like a Together model
  if (isTogetherModelId(modelId)) {
    return {
      id: modelId,
      provider: 'together',
      name: modelId,
      description: 'Together.ai (OpenAI-compatible)',
      maxTokens: 8192,
      capabilities: [
        ModelCapabilities.TEXT_GENERATION,
        ModelCapabilities.OBJECT_GENERATION,
        ModelCapabilities.TOOL_USAGE,
        ModelCapabilities.STREAMING,
      ],
    };
  }
  return SUPPORTED_MODELS[modelId] || SUPPORTED_MODELS['gpt-4o-mini'];
}

/**
 * Get provider instance for a given model ID
 * @param {string} modelId - Model identifier
 * @returns {Object} Provider instance with model
 */
export function getProviderModel(modelId) {
  // Route Together model IDs through OpenAI-compatible adapter
  if (isTogetherModelId(modelId)) {
    const together = createOpenAI({
      apiKey: process.env.TOGETHER_API_KEY,
      baseURL: process.env.TOGETHER_BASE_URL || 'https://api.together.xyz/v1',
    });
    return together(modelId);
  }

  const modelInfo = getModelInfo(modelId);
  
  // Use the actual API model ID from the config (handles aliases)
  // This ensures that aliases like 'claude-3-5-sonnet' map to 'claude-3-5-sonnet-20241022'
  const actualModelId = modelInfo.id || modelId;

  switch (modelInfo.provider) {
    case 'openai':
      return openai(actualModelId);

    case 'anthropic':
      return anthropic(actualModelId);

    case 'google':
      return google(actualModelId);

    default:
      // Default to OpenAI GPT-4o-mini
      return openai('gpt-4o-mini');
  }
}

/**
 * Get all models grouped by provider
 * @returns {Object} Models grouped by provider
 */
export function getModelsByProvider() {
  return {
    openai: Object.values(OPENAI_MODELS),
    anthropic: Object.values(ANTHROPIC_MODELS),
    google: Object.values(GOOGLE_MODELS),
    together: Object.values(TOGETHER_MODELS),
  };
}

/**
 * Get chat models only (models that support text/object generation)
 * @returns {Object} Chat models grouped by provider
 */
export function getChatModels() {
  const chatModels = getModelsByCapability(ModelCapabilities.TEXT_GENERATION);

  return {
    openai: chatModels.filter(m => m.provider === 'openai'),
    anthropic: chatModels.filter(m => m.provider === 'anthropic'),
    google: chatModels.filter(m => m.provider === 'google'),
  };
}

/**
 * Get all model IDs
 * @returns {string[]} Array of all model IDs
 */
export function getAllModelIds() {
  return Object.keys(SUPPORTED_MODELS);
}

/**
 * Check if a model ID is valid
 * @param {string} modelId - Model identifier to check
 * @returns {boolean} True if model is supported
 */
export function isValidModel(modelId) {
  return (modelId in SUPPORTED_MODELS) || isTogetherModelId(modelId);
}

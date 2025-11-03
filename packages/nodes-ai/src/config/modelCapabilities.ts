/**
 * Model Capabilities Configuration
 *
 * This file defines the capabilities and constraints for each AI model
 * supported in the workflow builder.
 */

export type ModelCapability =
  | 'text-generation'
  | 'structured-output'
  | 'vision'
  | 'audio-input'
  | 'audio-output'
  | 'image-generation'
  | 'tool-calling'
  | 'reasoning'
  | 'json-mode';

export type GenerationMode =
  | 'text'
  | 'structured'
  | 'image'
  | 'audio'
  | 'speech';

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  capabilities: ModelCapability[];
  supportedModes: GenerationMode[];
  maxTokens?: number;
  description?: string;
}

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // OpenAI Models
  'gpt-5-pro': {
    id: 'gpt-5-pro',
    name: 'GPT-5 Pro',
    provider: 'openai',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    description: 'Most capable GPT-5 model'
  },
  'gpt-5': {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    description: 'Standard GPT-5 model'
  },
  'gpt-5-mini': {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    description: 'Fast and efficient GPT-5'
  },
  'gpt-4.1': {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openai',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    description: 'Latest GPT-4.1 model'
  },
  'gpt-4.1-mini': {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'openai',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    description: 'Fast GPT-4.1 variant'
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    maxTokens: 4096,
    description: 'Most capable GPT-4 Omni'
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    maxTokens: 4096,
    description: 'Fast and affordable'
  },
  'gpt-4o-audio-preview': {
    id: 'gpt-4o-audio-preview',
    name: 'GPT-4o Audio',
    provider: 'openai',
    capabilities: ['text-generation', 'audio-input', 'audio-output', 'tool-calling'],
    supportedModes: ['text', 'audio'],
    description: 'Audio input/output support'
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    maxTokens: 4096,
    description: 'Legacy GPT-4 Turbo'
  },
  'o3': {
    id: 'o3',
    name: 'O3',
    provider: 'openai',
    capabilities: ['text-generation', 'reasoning', 'tool-calling'],
    supportedModes: ['text'],
    description: 'Advanced reasoning model'
  },
  'o3-mini': {
    id: 'o3-mini',
    name: 'O3 Mini',
    provider: 'openai',
    capabilities: ['text-generation', 'reasoning', 'tool-calling'],
    supportedModes: ['text'],
    description: 'Fast reasoning model'
  },
  'o1': {
    id: 'o1',
    name: 'O1',
    provider: 'openai',
    capabilities: ['text-generation', 'reasoning', 'tool-calling'],
    supportedModes: ['text'],
    description: 'Reasoning model'
  },
  'dall-e-3': {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    description: 'Advanced image generation'
  },
  'dall-e-2': {
    id: 'dall-e-2',
    name: 'DALL-E 2',
    provider: 'openai',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    description: 'Image generation'
  },
  'tts-1': {
    id: 'tts-1',
    name: 'TTS-1',
    provider: 'openai',
    capabilities: ['audio-output'],
    supportedModes: ['speech'],
    description: 'Text-to-speech'
  },
  'tts-1-hd': {
    id: 'tts-1-hd',
    name: 'TTS-1 HD',
    provider: 'openai',
    capabilities: ['audio-output'],
    supportedModes: ['speech'],
    description: 'High-quality text-to-speech'
  },

  // Anthropic Models
  'claude-3-5-sonnet-20241022': {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    maxTokens: 8192,
    description: 'Latest Claude model'
  },
  'claude-3-5-haiku-20241022': {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    maxTokens: 8192,
    description: 'Fast Claude model'
  },
  'claude-3-opus-20240229': {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    maxTokens: 4096,
    description: 'Most capable Claude 3'
  },
  'claude-3-sonnet-20240229': {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    maxTokens: 4096,
    description: 'Balanced Claude 3'
  },
  'claude-3-haiku-20240307': {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    maxTokens: 4096,
    description: 'Fast Claude 3'
  },

  // Google Models
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    description: 'Latest Gemini Pro'
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    description: 'Fast Gemini 2.5'
  },
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    description: 'Fast Gemini 2.0'
  },
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    description: 'Gemini 1.5 Pro'
  },
  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    description: 'Fast Gemini 1.5'
  },
  'gemini-1.5-flash-8b': {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash 8B',
    provider: 'google',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    description: 'Efficient Gemini 1.5'
  },
};

/**
 * Get model configuration by ID
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODEL_CONFIGS[modelId];
}

/**
 * Check if a model supports a specific capability
 */
export function modelSupportsCapability(modelId: string, capability: ModelCapability): boolean {
  const config = getModelConfig(modelId);
  return config?.capabilities.includes(capability) ?? false;
}

/**
 * Check if a model supports a specific generation mode
 */
export function modelSupportsMode(modelId: string, mode: GenerationMode): boolean {
  const config = getModelConfig(modelId);
  return config?.supportedModes.includes(mode) ?? false;
}

/**
 * Get all models that support a specific mode
 */
export function getModelsByMode(mode: GenerationMode): ModelConfig[] {
  return Object.values(MODEL_CONFIGS).filter(config =>
    config.supportedModes.includes(mode)
  );
}

/**
 * Get capability display information
 */
export function getCapabilityInfo(capability: ModelCapability): { icon: string; label: string; color: string } {
  const capabilityInfo: Record<ModelCapability, { icon: string; label: string; color: string }> = {
    'text-generation': { icon: '📝', label: 'Text Generation', color: '#00f0ff' },
    'structured-output': { icon: '🏗️', label: 'Structured Data', color: '#b026ff' },
    'vision': { icon: '👁️', label: 'Vision (Image Input)', color: '#39ff14' },
    'audio-input': { icon: '🎤', label: 'Audio Input', color: '#ff00ff' },
    'audio-output': { icon: '🔊', label: 'Audio Output', color: '#ff6b00' },
    'image-generation': { icon: '🎨', label: 'Image Generation', color: '#ff0040' },
    'tool-calling': { icon: '🛠️', label: 'Tool Calling', color: '#ffff00' },
    'reasoning': { icon: '🧠', label: 'Advanced Reasoning', color: '#00ffff' },
    'json-mode': { icon: '{ }', label: 'JSON Mode', color: '#b026ff' },
  };
  return capabilityInfo[capability] || { icon: '?', label: capability, color: '#888' };
}

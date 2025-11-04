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
  provider: 'openai' | 'anthropic' | 'google' | 'together';
  capabilities: ModelCapability[];
  supportedModes: GenerationMode[];
  maxTokens?: number;
  description?: string;
  disabled?: boolean;
  notes?: string;
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

  // Together.ai Chat Models (JSON mode capable)
  'moonshotai/Kimi-K2-Instruct-0905': {
    id: 'moonshotai/Kimi-K2-Instruct-0905',
    name: 'Kimi K2 Instruct 0905',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    description: 'Moonshot Kimi K2 Instruct (0905)',
  },
  'deepseek-ai/DeepSeek-V3.1': {
    id: 'deepseek-ai/DeepSeek-V3.1',
    name: 'DeepSeek-V3.1',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'openai/gpt-oss-120b': {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'openai/gpt-oss-20b': {
    id: 'openai/gpt-oss-20b',
    name: 'GPT-OSS 20B',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'moonshotai/Kimi-K2-Instruct': {
    id: 'moonshotai/Kimi-K2-Instruct',
    name: 'Kimi K2 Instruct',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'zai-org/GLM-4.5-Air-FP8': {
    id: 'zai-org/GLM-4.5-Air-FP8',
    name: 'GLM 4.5 Air (FP8)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'Qwen/Qwen3-235B-A22B-Thinking-2507': {
    id: 'Qwen/Qwen3-235B-A22B-Thinking-2507',
    name: 'Qwen3 235B A22B Thinking 2507',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'reasoning'],
    supportedModes: ['text', 'structured'],
  },
  'Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8': {
    id: 'Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8',
    name: 'Qwen3 Coder 480B A35B Instruct (FP8)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'Qwen/Qwen3-235B-A22B-Instruct-2507-tput': {
    id: 'Qwen/Qwen3-235B-A22B-Instruct-2507-tput',
    name: 'Qwen3 235B A22B Instruct 2507 (Throughput)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'Qwen/Qwen3-Next-80B-A3B-Instruct': {
    id: 'Qwen/Qwen3-Next-80B-A3B-Instruct',
    name: 'Qwen3 Next 80B A3B Instruct',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'Qwen/Qwen3-Next-80B-A3B-Thinking': {
    id: 'Qwen/Qwen3-Next-80B-A3B-Thinking',
    name: 'Qwen3 Next 80B A3B Thinking',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'reasoning'],
    supportedModes: ['text', 'structured'],
  },
  'deepseek-ai/DeepSeek-R1': {
    id: 'deepseek-ai/DeepSeek-R1',
    name: 'DeepSeek-R1-0528',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'reasoning'],
    supportedModes: ['text', 'structured'],
  },
  'deepseek-ai/DeepSeek-R1-0528-tput': {
    id: 'deepseek-ai/DeepSeek-R1-0528-tput',
    name: 'DeepSeek-R1-0528 (Throughput)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'reasoning'],
    supportedModes: ['text', 'structured'],
  },
  'deepseek-ai/DeepSeek-V3': {
    id: 'deepseek-ai/DeepSeek-V3',
    name: 'DeepSeek-V3-0324',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8': {
    id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
    name: 'Llama 4 Maverick (17Bx128E) FP8',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'vision'],
    supportedModes: ['text', 'structured'],
  },
  'meta-llama/Llama-4-Scout-17B-16E-Instruct': {
    id: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
    name: 'Llama 4 Scout (17Bx16E)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'vision'],
    supportedModes: ['text', 'structured'],
  },
  'meta-llama/Llama-3.3-70B-Instruct-Turbo': {
    id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    name: 'Llama 3.3 70B Instruct Turbo',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'deepcogito/cogito-v2-preview-llama-70B': {
    id: 'deepcogito/cogito-v2-preview-llama-70B',
    name: 'Cogito v2 Preview 70B',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'deepcogito/cogito-v2-preview-llama-109B-MoE': {
    id: 'deepcogito/cogito-v2-preview-llama-109B-MoE',
    name: 'Cogito v2 Preview 109B MoE',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'deepcogito/cogito-v2-preview-llama-405B': {
    id: 'deepcogito/cogito-v2-preview-llama-405B',
    name: 'Cogito v2 Preview 405B',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'deepcogito/cogito-v2-preview-deepseek-671b': {
    id: 'deepcogito/cogito-v2-preview-deepseek-671b',
    name: 'Cogito v2 Preview 671B MoE',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'deepseek-ai/DeepSeek-R1-Distill-Llama-70B': {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',
    name: 'DeepSeek R1 Distill Llama 70B',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'reasoning'],
    supportedModes: ['text', 'structured'],
  },
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B': {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B',
    name: 'DeepSeek R1 Distill Qwen 14B',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'reasoning'],
    supportedModes: ['text', 'structured'],
  },
  'marin-community/marin-8b-instruct': {
    id: 'marin-community/marin-8b-instruct',
    name: 'Marin 8B Instruct',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'mistralai/Magistral-Small-2506': {
    id: 'mistralai/Magistral-Small-2506',
    name: 'Magistral Small 2506 API',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo': {
    id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    name: 'Llama 3.1 8B Instruct Turbo',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free': {
    id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
    name: 'Llama 3.3 70B Instruct Turbo (Free)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    notes: 'Reduced rate limits on free tier',
  },
  'Qwen/Qwen2.5-7B-Instruct-Turbo': {
    id: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
    name: 'Qwen 2.5 7B Instruct Turbo',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'Qwen/Qwen2.5-72B-Instruct-Turbo': {
    id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
    name: 'Qwen 2.5 72B Instruct Turbo',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'Qwen/Qwen2.5-VL-72B-Instruct': {
    id: 'Qwen/Qwen2.5-VL-72B-Instruct',
    name: 'Qwen2.5 VL 72B Instruct',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'vision'],
    supportedModes: ['text', 'structured'],
  },
  'Qwen/Qwen2.5-Coder-32B-Instruct': {
    id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    name: 'Qwen 2.5 Coder 32B Instruct',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'Qwen/QwQ-32B': {
    id: 'Qwen/QwQ-32B',
    name: 'QwQ-32B',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'reasoning'],
    supportedModes: ['text', 'structured'],
  },
  'Qwen/Qwen3-235B-A22B-fp8-tput': {
    id: 'Qwen/Qwen3-235B-A22B-fp8-tput',
    name: 'Qwen3 235B A22B Throughput (FP8)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'arcee-ai/coder-large': {
    id: 'arcee-ai/coder-large',
    name: 'Arcee AI Coder-Large',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'arcee-ai/virtuoso-medium-v2': {
    id: 'arcee-ai/virtuoso-medium-v2',
    name: 'Arcee AI Virtuoso Medium',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'arcee-ai/virtuoso-large': {
    id: 'arcee-ai/virtuoso-large',
    name: 'Arcee AI Virtuoso Large',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'arcee-ai/maestro-reasoning': {
    id: 'arcee-ai/maestro-reasoning',
    name: 'Arcee AI Maestro (Reasoning)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'reasoning'],
    supportedModes: ['text', 'structured'],
  },
  'arcee-ai/caller': {
    id: 'arcee-ai/caller',
    name: 'Arcee AI Caller',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'arcee-ai/arcee-blitz': {
    id: 'arcee-ai/arcee-blitz',
    name: 'Arcee AI Blitz',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo': {
    id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
    name: 'Llama 3.1 405B Instruct Turbo',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'meta-llama/Llama-3.2-3B-Instruct-Turbo': {
    id: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
    name: 'Llama 3.2 3B Instruct Turbo',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'meta-llama/Meta-Llama-3-8B-Instruct-Lite': {
    id: 'meta-llama/Meta-Llama-3-8B-Instruct-Lite',
    name: 'Llama 3 8B Instruct Lite',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'meta-llama/Llama-3-70b-chat-hf': {
    id: 'meta-llama/Llama-3-70b-chat-hf',
    name: 'Llama 3 70B Instruct Reference',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'google/gemma-3n-E4B-it': {
    id: 'google/gemma-3n-E4B-it',
    name: 'Gemma 3N E4B Instruct',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'vision'],
    supportedModes: ['text', 'structured'],
  },
  'mistralai/Mistral-7B-Instruct-v0.1': {
    id: 'mistralai/Mistral-7B-Instruct-v0.1',
    name: 'Mistral 7B Instruct v0.1',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'mistralai/Mistral-7B-Instruct-v0.2': {
    id: 'mistralai/Mistral-7B-Instruct-v0.2',
    name: 'Mistral 7B Instruct v0.2',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'mistralai/Mistral-7B-Instruct-v0.3': {
    id: 'mistralai/Mistral-7B-Instruct-v0.3',
    name: 'Mistral 7B Instruct v0.3',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
  },
  'arcee_ai/arcee-spotlight': {
    id: 'arcee_ai/arcee-spotlight',
    name: 'Arcee AI Spotlight (Vision)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'vision'],
    supportedModes: ['text', 'structured'],
  },

  // Together.ai Image Models (only enabling FLUX models we wired)
  'black-forest-labs/FLUX.1-schnell': {
    id: 'black-forest-labs/FLUX.1-schnell',
    name: 'FLUX.1 Schnell',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
  },
  'black-forest-labs/FLUX.1-dev': {
    id: 'black-forest-labs/FLUX.1-dev',
    name: 'FLUX.1 Dev',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
  },
  'black-forest-labs/FLUX.1.1-pro': {
    id: 'black-forest-labs/FLUX.1.1-pro',
    name: 'FLUX 1.1 Pro',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
  },
  'black-forest-labs/FLUX.1-kontext-pro': {
    id: 'black-forest-labs/FLUX.1-kontext-pro',
    name: 'FLUX.1 Kontext Pro',
    provider: 'together',
    capabilities: ['image-generation', 'vision'],
    supportedModes: ['image'],
  },
  'black-forest-labs/FLUX.1-kontext-max': {
    id: 'black-forest-labs/FLUX.1-kontext-max',
    name: 'FLUX.1 Kontext Max',
    provider: 'together',
    capabilities: ['image-generation', 'vision'],
    supportedModes: ['image'],
  },
  'black-forest-labs/FLUX.1-kontext-dev': {
    id: 'black-forest-labs/FLUX.1-kontext-dev',
    name: 'FLUX.1 Kontext Dev',
    provider: 'together',
    capabilities: ['image-generation', 'vision'],
    supportedModes: ['image'],
  },
  'black-forest-labs/FLUX.1-krea-dev': {
    id: 'black-forest-labs/FLUX.1-krea-dev',
    name: 'FLUX.1 Krea Dev',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
  },
  // Other image models present but disabled until verified
  'google/imagen-4.0-preview': {
    id: 'google/imagen-4.0-preview',
    name: 'Imagen 4.0 Preview',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: true,
    notes: 'Not yet wired in togetherImagesCreate tests',
  },
  'google/imagen-4.0-fast': {
    id: 'google/imagen-4.0-fast',
    name: 'Imagen 4.0 Fast',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: true,
  },
  'google/imagen-4.0-ultra': {
    id: 'google/imagen-4.0-ultra',
    name: 'Imagen 4.0 Ultra',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: true,
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

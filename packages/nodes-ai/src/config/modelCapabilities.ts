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
  contextLength?: number;
  quantization?: string;
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
  // Claude 4 Series (with date suffixes - actual API model IDs)
  'claude-sonnet-4-5-20250929': {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    maxTokens: 65536, // 64K tokens max output
    description: 'Our smartest model for complex agents and coding'
  },
  'claude-haiku-4-5-20251001': {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    maxTokens: 65536, // 64K tokens max output
    description: 'Our fastest model with near-frontier intelligence'
  },
  'claude-opus-4-1-20250805': {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
    provider: 'anthropic',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    maxTokens: 32768, // 32K tokens max output
    description: 'Exceptional model for specialized reasoning tasks'
  },
  // Claude 4 Series (aliases)
  'claude-sonnet-4-5': {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    maxTokens: 65536,
    description: 'Our smartest model for complex agents and coding'
  },
  'claude-haiku-4-5': {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    maxTokens: 65536,
    description: 'Our fastest model with near-frontier intelligence'
  },
  'claude-opus-4-1': {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
    provider: 'anthropic',
    capabilities: ['text-generation', 'structured-output', 'vision', 'tool-calling', 'json-mode'],
    supportedModes: ['text', 'structured'],
    maxTokens: 32768,
    description: 'Exceptional model for specialized reasoning tasks'
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
    contextLength: 262144,
    quantization: 'FP8',
  },
  'deepseek-ai/DeepSeek-V3.1': {
    id: 'deepseek-ai/DeepSeek-V3.1',
    name: 'DeepSeek-V3.1',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 128000,
    quantization: 'FP8',
  },
  'openai/gpt-oss-120b': {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 128000,
    quantization: 'MXFP4',
  },
  'openai/gpt-oss-20b': {
    id: 'openai/gpt-oss-20b',
    name: 'GPT-OSS 20B',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 128000,
    quantization: 'MXFP4',
  },
  'moonshotai/Kimi-K2-Instruct': {
    id: 'moonshotai/Kimi-K2-Instruct',
    name: 'Kimi K2 Instruct',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 128000,
    quantization: 'FP8',
  },
  'zai-org/GLM-4.5-Air-FP8': {
    id: 'zai-org/GLM-4.5-Air-FP8',
    name: 'GLM 4.5 Air (FP8)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 131072,
    quantization: 'FP8',
  },
  'Qwen/Qwen3-235B-A22B-Thinking-2507': {
    id: 'Qwen/Qwen3-235B-A22B-Thinking-2507',
    name: 'Qwen3 235B A22B Thinking 2507',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'reasoning'],
    supportedModes: ['text', 'structured'],
    contextLength: 262144,
    quantization: 'FP8',
  },
  'Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8': {
    id: 'Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8',
    name: 'Qwen3 Coder 480B A35B Instruct (FP8)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 256000,
    quantization: 'FP8',
  },
  'Qwen/Qwen3-235B-A22B-Instruct-2507-tput': {
    id: 'Qwen/Qwen3-235B-A22B-Instruct-2507-tput',
    name: 'Qwen3 235B A22B Instruct 2507 (Throughput)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 262144,
    quantization: 'FP8',
  },
  'Qwen/Qwen3-Next-80B-A3B-Instruct': {
    id: 'Qwen/Qwen3-Next-80B-A3B-Instruct',
    name: 'Qwen3 Next 80B A3B Instruct',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 262144,
    quantization: 'BF16',
  },
  'Qwen/Qwen3-Next-80B-A3B-Thinking': {
    id: 'Qwen/Qwen3-Next-80B-A3B-Thinking',
    name: 'Qwen3 Next 80B A3B Thinking',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'reasoning'],
    supportedModes: ['text', 'structured'],
    contextLength: 262144,
    quantization: 'BF16',
  },
  'deepseek-ai/DeepSeek-R1': {
    id: 'deepseek-ai/DeepSeek-R1',
    name: 'DeepSeek-R1-0528',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'reasoning'],
    supportedModes: ['text', 'structured'],
    contextLength: 163839,
    quantization: 'FP8',
  },
  'deepseek-ai/DeepSeek-R1-0528-tput': {
    id: 'deepseek-ai/DeepSeek-R1-0528-tput',
    name: 'DeepSeek-R1-0528 (Throughput)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'reasoning'],
    supportedModes: ['text', 'structured'],
    contextLength: 163839,
    quantization: 'FP8',
  },
  'deepseek-ai/DeepSeek-V3': {
    id: 'deepseek-ai/DeepSeek-V3',
    name: 'DeepSeek-V3-0324',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 163839,
    quantization: 'FP8',
  },
  'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8': {
    id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
    name: 'Llama 4 Maverick (17Bx128E) FP8',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'vision'],
    supportedModes: ['text', 'structured'],
    contextLength: 1048576,
    quantization: 'FP8',
  },
  'meta-llama/Llama-4-Scout-17B-16E-Instruct': {
    id: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
    name: 'Llama 4 Scout (17Bx16E)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'vision'],
    supportedModes: ['text', 'structured'],
    contextLength: 1048576,
    quantization: 'FP16',
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
    contextLength: 131072,
    quantization: 'FP8',
  },
  'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo': {
    id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    name: 'Llama 3.1 8B Instruct Turbo',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 131072,
    quantization: 'FP8',
  },
  'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free': {
    id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
    name: 'Llama 3.3 70B Instruct Turbo (Free)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    notes: 'Reduced rate limits on free tier',
    contextLength: 8193,
    quantization: 'FP8',
  },
  'Qwen/Qwen2.5-7B-Instruct-Turbo': {
    id: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
    name: 'Qwen 2.5 7B Instruct Turbo',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 32768,
    quantization: 'FP8',
  },
  'Qwen/Qwen2.5-72B-Instruct-Turbo': {
    id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
    name: 'Qwen 2.5 72B Instruct Turbo',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 32768,
    quantization: 'FP8',
  },
  'Qwen/Qwen2.5-VL-72B-Instruct': {
    id: 'Qwen/Qwen2.5-VL-72B-Instruct',
    name: 'Qwen2.5 VL 72B Instruct',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'vision'],
    supportedModes: ['text', 'structured'],
    contextLength: 32768,
    quantization: 'FP8',
  },
  'Qwen/Qwen2.5-Coder-32B-Instruct': {
    id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    name: 'Qwen 2.5 Coder 32B Instruct',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 32768,
    quantization: 'FP16',
  },
  'Qwen/QwQ-32B': {
    id: 'Qwen/QwQ-32B',
    name: 'QwQ-32B',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode', 'reasoning'],
    supportedModes: ['text', 'structured'],
    contextLength: 32768,
    quantization: 'FP16',
  },
  'Qwen/Qwen3-235B-A22B-fp8-tput': {
    id: 'Qwen/Qwen3-235B-A22B-fp8-tput',
    name: 'Qwen3 235B A22B Throughput (FP8)',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 40960,
    quantization: 'FP8',
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
    contextLength: 128000,
  },
  'arcee-ai/virtuoso-large': {
    id: 'arcee-ai/virtuoso-large',
    name: 'Arcee AI Virtuoso Large',
    provider: 'together',
    capabilities: ['text-generation', 'structured-output', 'json-mode'],
    supportedModes: ['text', 'structured'],
    contextLength: 128000,
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
    // @ts-ignore
    pricePerImageUSD: 0.0027,
    // @ts-ignore
    imagesPerDollar: 370,
    // @ts-ignore
    defaultSteps: 4,
  },
  'black-forest-labs/FLUX.1-schnell-Free': {
    id: 'black-forest-labs/FLUX.1-schnell-Free',
    name: 'FLUX.1 Schnell (Free)',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    notes: 'Free tier with reduced rate limits/perf',
  },
  'black-forest-labs/FLUX.1-dev': {
    id: 'black-forest-labs/FLUX.1-dev',
    name: 'FLUX.1 Dev',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    // @ts-ignore
    pricePerImageUSD: 0.025,
    // @ts-ignore
    imagesPerDollar: 40,
    // @ts-ignore
    defaultSteps: 28,
  },
  'black-forest-labs/FLUX.1.1-pro': {
    id: 'black-forest-labs/FLUX.1.1-pro',
    name: 'FLUX 1.1 Pro',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    // @ts-ignore
    pricePerImageUSD: 0.04,
    // @ts-ignore
    imagesPerDollar: 25,
  },
  // FLUX.1 Pro (listed, disabled until verified)
  'black-forest-labs/FLUX.1-pro': {
    id: 'black-forest-labs/FLUX.1-pro',
    name: 'FLUX.1 Pro',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.05,
    // @ts-ignore
    imagesPerDollar: 20,
    // @ts-ignore
    defaultSteps: 28,
  },
  'black-forest-labs/FLUX.1-kontext-pro': {
    id: 'black-forest-labs/FLUX.1-kontext-pro',
    name: 'FLUX.1 Kontext Pro',
    provider: 'together',
    capabilities: ['image-generation', 'vision'],
    supportedModes: ['image'],
    // Pricing/behavior metadata for UI
    // Provided values: $0.025 per image, ~40 images per $1, default steps 28
    // (actual Together pricing is per-MP; this is a simplified display)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    pricePerImageUSD: 0.04,
    // @ts-ignore
    imagesPerDollar: 25,
    // @ts-ignore
    defaultSteps: 28,
  },
  'black-forest-labs/FLUX.1-kontext-max': {
    id: 'black-forest-labs/FLUX.1-kontext-max',
    name: 'FLUX.1 Kontext Max',
    provider: 'together',
    capabilities: ['image-generation', 'vision'],
    supportedModes: ['image'],
    // @ts-ignore
    pricePerImageUSD: 0.08,
    // @ts-ignore
    imagesPerDollar: 12.5,
    // @ts-ignore
    defaultSteps: 28,
  },
  'black-forest-labs/FLUX.1-kontext-dev': {
    id: 'black-forest-labs/FLUX.1-kontext-dev',
    name: 'FLUX.1 Kontext Dev',
    provider: 'together',
    capabilities: ['image-generation', 'vision'],
    supportedModes: ['image'],
    // @ts-ignore
    pricePerImageUSD: 0.025,
    // @ts-ignore
    imagesPerDollar: 40,
    // @ts-ignore
    defaultSteps: 28,
  },
  'black-forest-labs/FLUX.1-krea-dev': {
    id: 'black-forest-labs/FLUX.1-krea-dev',
    name: 'FLUX.1 Krea Dev',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    // @ts-ignore
    pricePerImageUSD: 0.025,
    // @ts-ignore
    imagesPerDollar: 40,
    // @ts-ignore
    defaultSteps: 28,
  },
  // Additional Together image models (listed, disabled until verified)
  'google/flash-image-2.5': {
    id: 'google/flash-image-2.5',
    name: 'Flash Image 2.5 (Nano Banana)',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.039,
    // @ts-ignore
    imagesPerDollar: 25.6,
  },
  'ByteDance-Seed/Seedream-3.0': {
    id: 'ByteDance-Seed/Seedream-3.0',
    name: 'Seedream 3.0',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.018,
    // @ts-ignore
    imagesPerDollar: 55.5,
  },
  'ByteDance-Seed/Seedream-4.0': {
    id: 'ByteDance-Seed/Seedream-4.0',
    name: 'Seedream 4.0',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.03,
    // @ts-ignore
    imagesPerDollar: 33.3,
  },
  'ByteDance-Seed/SeedEdit': {
    id: 'ByteDance-Seed/SeedEdit',
    name: 'SeedEdit',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.03,
    // @ts-ignore
    imagesPerDollar: 33.3,
  },
  'Qwen/Qwen-Image': {
    id: 'Qwen/Qwen-Image',
    name: 'Qwen Image',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.0058,
    // @ts-ignore
    imagesPerDollar: 172.4,
  },
  'Qwen/Qwen-Image-Edit': {
    id: 'Qwen/Qwen-Image-Edit',
    name: 'Qwen Image Edit',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.0032,
    // @ts-ignore
    imagesPerDollar: 312.5,
  },
  'RunDiffusion/Juggernaut-pro-flux': {
    id: 'RunDiffusion/Juggernaut-pro-flux',
    name: 'Juggernaut Pro Flux',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.0049,
    // @ts-ignore
    imagesPerDollar: 204,
  },
  'Rundiffusion/Juggernaut-Lightning-Flux': {
    id: 'Rundiffusion/Juggernaut-Lightning-Flux',
    name: 'Juggernaut Lightning Flux',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.0017,
    // @ts-ignore
    imagesPerDollar: 588.2,
  },
  'HiDream-ai/HiDream-I1-Full': {
    id: 'HiDream-ai/HiDream-I1-Full',
    name: 'HiDream-I1-Full',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.009,
    // @ts-ignore
    imagesPerDollar: 111.1,
  },
  'HiDream-ai/HiDream-I1-Dev': {
    id: 'HiDream-ai/HiDream-I1-Dev',
    name: 'HiDream-I1-Dev',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.0045,
    // @ts-ignore
    imagesPerDollar: 222.2,
  },
  'HiDream-ai/HiDream-I1-Fast': {
    id: 'HiDream-ai/HiDream-I1-Fast',
    name: 'HiDream-I1-Fast',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.0032,
    // @ts-ignore
    imagesPerDollar: 312.5,
  },
  'ideogram/ideogram-3.0': {
    id: 'ideogram/ideogram-3.0',
    name: 'Ideogram 3.0',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.06,
    // @ts-ignore
    imagesPerDollar: 16.6,
  },
  'Lykon/DreamShaper': {
    id: 'Lykon/DreamShaper',
    name: 'DreamShaper',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.0006,
    // @ts-ignore
    imagesPerDollar: 1666.6,
  },
  'stabilityai/stable-diffusion-xl-base-1.0': {
    id: 'stabilityai/stable-diffusion-xl-base-1.0',
    name: 'Stable Diffusion XL (base 1.0)',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.0019,
    // @ts-ignore
    imagesPerDollar: 526.3,
  },
  'stabilityai/stable-diffusion-3-medium': {
    id: 'stabilityai/stable-diffusion-3-medium',
    name: 'Stable Diffusion 3 (medium)',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.0019,
    // @ts-ignore
    imagesPerDollar: 526.3,
  },
  // Other image models present but disabled until verified
  'google/imagen-4.0-preview': {
    id: 'google/imagen-4.0-preview',
    name: 'Imagen 4.0 Preview',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    notes: 'Not yet wired in togetherImagesCreate tests',
    // @ts-ignore
    pricePerImageUSD: 0.04,
    // @ts-ignore
    imagesPerDollar: 25,
  },
  'google/imagen-4.0-fast': {
    id: 'google/imagen-4.0-fast',
    name: 'Imagen 4.0 Fast',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.02,
    // @ts-ignore
    imagesPerDollar: 50,
  },
  'google/imagen-4.0-ultra': {
    id: 'google/imagen-4.0-ultra',
    name: 'Imagen 4.0 Ultra',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.06,
    // @ts-ignore
    imagesPerDollar: 16.6,
  },
  // FLUX.1 Canny [pro] (not yet verified)
  'black-forest-labs/FLUX.1-canny-pro': {
    id: 'black-forest-labs/FLUX.1-canny-pro',
    name: 'FLUX.1 Canny Pro',
    provider: 'together',
    capabilities: ['image-generation'],
    supportedModes: ['image'],
    disabled: false,
    // @ts-ignore
    pricePerImageUSD: 0.05,
    // @ts-ignore
    imagesPerDollar: 20,
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

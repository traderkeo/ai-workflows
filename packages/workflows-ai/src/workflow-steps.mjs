/**
 * AI Workflow Steps
 *
 * Individual durable steps that execute AI operations.
 * Each step uses the 'use step' directive for automatic retries and durability.
 */

import { generateTextNode, generateStructuredDataNode, streamTextNode } from '@repo/ai-workers';

/**
 * Text generation step
 * @param {Object} params - Parameters for text generation
 * @returns {Promise<Object>} Generated text result
 */
export async function textGenerationStep({ prompt, model, temperature, systemPrompt }) {
  'use step';

  const result = await generateTextNode({
    prompt,
    model: model || 'gpt-4o-mini',
    temperature: temperature ?? 0.7,
    systemPrompt: systemPrompt || '',
  });

  if (!result.success) {
    throw new Error(result.error || 'Text generation failed');
  }

  return {
    text: result.text,
    usage: result.usage,
    model: result.metadata.model,
  };
}

/**
 * Streaming text generation step - streams chunks in real-time
 * @param {Object} params - Parameters for streaming text generation
 * @param {Function} params.onChunk - Callback for each text chunk (chunk, fullText)
 * @returns {Promise<Object>} Generated text result
 */
export async function streamTextGenerationStep({ prompt, model, temperature, systemPrompt, onChunk }) {
  'use step';

  let fullText = '';
  
  const result = await streamTextNode({
    prompt,
    model: model || 'gpt-4o-mini',
    temperature: temperature ?? 0.7,
    systemPrompt: systemPrompt || '',
    onChunk: (chunk, accumulatedText) => {
      fullText = accumulatedText;
      if (onChunk) {
        onChunk(chunk, accumulatedText);
      }
    },
  });

  if (!result.success) {
    throw new Error(result.error || 'Text generation failed');
  }

  return {
    text: result.text,
    usage: result.usage,
    model: result.metadata.model,
  };
}

/**
 * Structured data extraction step
 * @param {Object} params - Parameters for structured data extraction
 * @returns {Promise<Object>} Extracted structured data
 */
export async function structuredDataStep({ prompt, schema, schemaName, model }) {
  'use step';

  const result = await generateStructuredDataNode({
    prompt,
    schema,
    schemaName: schemaName || 'data',
    model: model || 'gpt-4o-mini',
  });

  if (!result.success) {
    throw new Error(result.error || 'Structured data extraction failed');
  }

  return {
    data: result.object,
    usage: result.usage,
    model: result.metadata.model,
  };
}

/**
 * Transform step - applies a transformation to data
 * @param {Object} params - Parameters for transformation
 * @returns {Promise<any>} Transformed data
 */
export async function transformStep({ data, transformer }) {
  'use step';

  return await transformer(data);
}

/**
 * Validation step - validates data against rules
 * @param {Object} params - Parameters for validation
 * @returns {Promise<Object>} Validation result
 */
export async function validationStep({ data, validator }) {
  'use step';

  const isValid = await validator(data);

  return {
    valid: isValid,
    data,
  };
}

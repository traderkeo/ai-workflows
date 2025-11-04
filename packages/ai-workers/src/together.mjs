/**
 * Minimal Together.ai REST client helpers (no external SDK)
 * Supports chat completions (streaming and non-streaming)
 */

const DEFAULT_BASE_URL = 'https://api.together.xyz/v1';

function getBaseURL() {
  return process.env.TOGETHER_BASE_URL || DEFAULT_BASE_URL;
}

function getApiKey() {
  const key = process.env.TOGETHER_API_KEY;
  if (!key) {
    throw new Error('TOGETHER_API_KEY is not set');
  }
  return key;
}

function normalizeMessages(messages) {
  return messages.map((m) => ({
    role: m.role,
    // Allow text strings or multimodal arrays/objects as-is (e.g., {type:'image_url',...})
    content: m.content,
  }));
}

async function getTogetherSdk() {
  try {
    const mod = await import('together-ai');
    const Together = mod.default || mod.Together || mod;
    const apiKey = getApiKey();
    return new Together({ apiKey, baseURL: getBaseURL() });
  } catch {
    return null;
  }
}

export async function togetherChatCompletion({
  model,
  messages,
  temperature = 0.7,
  maxTokens = 1024,
  responseFormat = undefined,
  stop = undefined,
  abortSignal,
}) {
  // Prefer Together SDK when available
  const sdk = await getTogetherSdk();
  if (sdk?.chat?.completions?.create) {
    const res = await sdk.chat.completions.create({
      model,
      messages: normalizeMessages(messages),
      temperature,
      max_tokens: maxTokens,
      ...(responseFormat ? { response_format: responseFormat } : {}),
      ...(stop ? { stop } : {}),
      stream: false,
      // SDK handles auth; abort via fetch is not exposed, so ignore abortSignal here
    });
    const choice = res.choices?.[0];
    const text = choice?.message?.content ?? '';
    return { text, usage: res.usage, finishReason: choice?.finish_reason, raw: res };
  }

  const url = `${getBaseURL()}/chat/completions`;
  const body = {
    model,
    messages: normalizeMessages(messages),
    temperature,
    max_tokens: maxTokens,
    ...(responseFormat ? { response_format: responseFormat } : {}),
    ...(stop ? { stop } : {}),
    stream: false,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
    signal: abortSignal ?? undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Together chat error: ${res.status} ${err}`);
  }

  const json = await res.json();
  const choice = json.choices?.[0];
  const text = choice?.message?.content ?? '';
  return {
    text,
    usage: json.usage,
    finishReason: choice?.finish_reason,
    raw: json,
  };
}

export async function togetherChatCompletionStream({
  model,
  messages,
  temperature = 0.7,
  maxTokens = 1024,
  responseFormat = undefined,
  stop = undefined,
  abortSignal,
  onDelta,
  onFinish,
}) {
  // Prefer Together SDK when available
  const sdk = await getTogetherSdk();
  if (sdk?.chat?.completions?.create) {
    const stream = await sdk.chat.completions.create({
      model,
      messages: normalizeMessages(messages),
      temperature,
      max_tokens: maxTokens,
      ...(responseFormat ? { response_format: responseFormat } : {}),
      ...(stop ? { stop } : {}),
      stream: true,
    });
    let fullText = '';
    let usage;
    let finishReason;
    for await (const chunk of stream) {
      const choice = chunk?.choices?.[0];
      const delta = choice?.delta?.content;
      const finalMsg = choice?.message?.content;
      const generatedText = chunk?.generated_text;
      if (typeof delta === 'string' && delta.length) {
        fullText += delta;
        onDelta?.(delta, fullText);
      } else if (typeof finalMsg === 'string' && finalMsg.length) {
        fullText += finalMsg;
        onDelta?.(finalMsg, fullText);
      } else if (typeof generatedText === 'string' && generatedText.length) {
        fullText = generatedText;
        onDelta?.(generatedText, fullText);
      }
      if (chunk?.usage) usage = chunk.usage;
      if (choice?.finish_reason) finishReason = choice.finish_reason;
    }
    onFinish?.({ text: fullText, usage, finishReason });
    return { text: fullText, usage, finishReason };
  }

  const url = `${getBaseURL()}/chat/completions`;
  const body = {
    model,
    messages: normalizeMessages(messages),
    temperature,
    max_tokens: maxTokens,
    ...(responseFormat ? { response_format: responseFormat } : {}),
    ...(stop ? { stop } : {}),
    stream: true,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
    signal: abortSignal ?? undefined,
  });

  if (!res.ok || !res.body) {
    const err = await res.text();
    throw new Error(`Together chat stream error: ${res.status} ${err}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let usage = undefined;
  let finishReason = undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const evt = JSON.parse(data);
        const choice = evt.choices?.[0];
        const delta = choice?.delta?.content;
        const finalMsg = choice?.message?.content;
        const generatedText = evt.generated_text;

        if (typeof delta === 'string' && delta.length > 0) {
          fullText += delta;
          onDelta?.(delta, fullText);
        } else if (typeof finalMsg === 'string' && finalMsg.length > 0) {
          // Some implementations may emit a final message instead of deltas
          fullText += finalMsg;
          onDelta?.(finalMsg, fullText);
        } else if (typeof generatedText === 'string' && generatedText.length > 0) {
          // Fallback if API provides a combined generated_text field
          fullText = generatedText;
          onDelta?.(generatedText, fullText);
        }

        if (evt.usage) usage = evt.usage;
        if (choice?.finish_reason) finishReason = choice.finish_reason;
      } catch {}
    }
  }

  onFinish?.({ text: fullText, usage, finishReason });
  return { text: fullText, usage, finishReason };
}

/**
 * Generate images using Together images API
 * Mirrors SDK together.images.create with REST fallback
 */
export async function togetherImagesCreate({
  model,
  prompt,
  width,
  height,
  n,
  steps,
  seed,
  response_format,
  image_url,
  negative_prompt,
  disable_safety_checker,
  aspect_ratio,
  image_loras,
  frame_images,
  abortSignal,
}) {
  const sdk = await getTogetherSdk();
  const body = {
    model,
    prompt,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(typeof n === 'number' ? { n } : {}),
    ...(typeof steps === 'number' ? { steps } : {}),
    ...(typeof seed === 'number' ? { seed } : {}),
    ...(response_format ? { response_format } : {}),
    ...(image_url ? { image_url } : {}),
    ...(negative_prompt ? { negative_prompt } : {}),
    ...(typeof disable_safety_checker === 'boolean' ? { disable_safety_checker } : {}),
    ...(aspect_ratio ? { aspect_ratio } : {}),
    ...(image_loras ? { image_loras } : {}),
    ...(frame_images ? { frame_images } : {}),
  };

  if (sdk?.images?.create) {
    const res = await sdk.images.create(body);
    return res;
  }

  const url = `${getBaseURL()}/images/generations`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
    signal: abortSignal ?? undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Together images error: ${res.status} ${err}`);
  }
  return await res.json();
}

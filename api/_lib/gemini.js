const DEFAULT_TIMEOUT_MS = 35_000;

export class GeminiApiError extends Error {
  constructor(message, { status = 500, code = '', model = '', details = null } = {}) {
    super(message);
    this.name = 'GeminiApiError';
    this.status = status;
    this.code = code;
    this.model = model;
    this.details = details;
  }
}

export function normalizeModel(model, fallback = 'gemini-3.6-flash') {
  const value = String(model || fallback).trim().replace(/^models\//, '');
  return value || fallback;
}

function uniqueModels(primary, fallbacks = []) {
  return [...new Set([primary, ...fallbacks].map((item) => normalizeModel(item)).filter(Boolean))];
}

function isRetryable(error) {
  if (!(error instanceof GeminiApiError)) return false;
  return [404, 408, 429, 500, 502, 503, 504].includes(error.status)
    || /high demand|temporar|capacity|unavailable|no longer available/i.test(error.message);
}

function friendlyMessage(payload, status) {
  const original = payload?.error?.message || `Gemini API retornou HTTP ${status}.`;
  if (status === 429 || status === 503 || /high demand|capacity/i.test(original)) {
    return 'O Gemini está temporariamente sem capacidade. Aguarde alguns minutos e tente novamente.';
  }
  if (status === 401 || status === 403) {
    return 'A chave Gemini foi recusada. Verifique a chave e as permissões no Google AI Studio.';
  }
  return original;
}

async function createInteraction({ apiKey, model, input, responseFormat, generationConfig, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const body = {
      model,
      input,
      store: false,
      ...(responseFormat ? { response_format: responseFormat } : {}),
      ...(generationConfig ? { generation_config: generationConfig } : {}),
    };
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new GeminiApiError(friendlyMessage(payload, response.status), {
        status: response.status,
        code: payload?.error?.status || '',
        model,
        details: payload?.error?.details || null,
      });
    }
    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new GeminiApiError('O Gemini excedeu o tempo de resposta. Tente novamente.', {
        status: 504,
        code: 'TIMEOUT',
        model,
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function callGemini({
  apiKey,
  model,
  prompt,
  responseFormat,
  generationConfig,
  fallbackModels = [],
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const models = uniqueModels(model, fallbackModels);
  let lastError;
  for (let index = 0; index < models.length; index += 1) {
    try {
      return await createInteraction({
        apiKey,
        model: models[index],
        input: prompt,
        responseFormat,
        generationConfig,
        timeoutMs,
      });
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || index === models.length - 1) throw error;
    }
  }
  throw lastError;
}

function textFromBlocks(blocks) {
  if (!Array.isArray(blocks)) return '';
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const block = blocks[index];
    if (!block || typeof block !== 'object') continue;
    if (typeof block.text === 'string' && block.text.trim()) return block.text.trim();
    const nested = textFromBlocks(block.content || block.outputs || block.parts);
    if (nested) return nested;
  }
  return '';
}

export function extractText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  const current = textFromBlocks(payload?.outputs) || textFromBlocks(payload?.steps);
  if (current) return current;
  return payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim() || '';
}

function imageFromBlocks(blocks) {
  if (!Array.isArray(blocks)) return null;
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const block = blocks[index];
    if (!block || typeof block !== 'object') continue;
    const mimeType = block.mime_type || block.mimeType || block.inlineData?.mimeType;
    const data = block.data || block.inlineData?.data;
    if (data && (block.type === 'image' || String(mimeType || '').startsWith('image/'))) {
      return { data, mimeType: mimeType || 'image/jpeg' };
    }
    const nested = imageFromBlocks(block.content || block.outputs || block.parts);
    if (nested) return nested;
  }
  return null;
}

export function extractImage(payload) {
  const direct = payload?.output_image;
  if (direct?.data) return { data: direct.data, mimeType: direct.mime_type || direct.mimeType || 'image/jpeg' };
  return imageFromBlocks(payload?.outputs)
    || imageFromBlocks(payload?.steps)
    || imageFromBlocks(payload?.candidates?.[0]?.content?.parts);
}

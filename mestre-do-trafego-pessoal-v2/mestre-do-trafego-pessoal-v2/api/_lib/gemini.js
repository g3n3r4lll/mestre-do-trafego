export async function callGemini({ apiKey, model, prompt, generationConfig }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      }),
      signal: controller.signal,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || `Gemini API retornou HTTP ${response.status}.`);
    if (payload?.promptFeedback?.blockReason) throw new Error(`Solicitação bloqueada: ${payload.promptFeedback.blockReason}.`);
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

export function extractText(payload) {
  return payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim() || '';
}

export function extractImage(payload) {
  const part = payload?.candidates?.[0]?.content?.parts?.find((item) => item.inlineData?.data);
  if (!part?.inlineData?.data) return null;
  return { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
}

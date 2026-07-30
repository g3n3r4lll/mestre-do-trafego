import { requireAuth } from './_lib/auth.js';
import { callGemini, extractImage } from './_lib/gemini.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  if (!requireAuth(req, res)) return;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (prompt.length < 20) return res.status(400).json({ error: 'Prompt visual insuficiente.' });
  try {
    const payload = await callGemini({
      apiKey, model: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image', prompt,
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
    });
    const image = extractImage(payload);
    if (!image) throw new Error('O modelo não retornou uma imagem.');
    return res.status(200).json({ dataUrl: `data:${image.mimeType};base64,${image.data}` });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Falha ao gerar imagem.' });
  }
}

import { requireAuth } from './_lib/auth.js';
import { callGemini, extractText } from './_lib/gemini.js';
import { strategyJsonSchema } from './_lib/schema.js';
import { buildStrategyPrompt } from './_lib/prompt.js';
import { calculateFinancials } from '../shared/finance.js';

const verdictRank = { BLOQUEAR: 0, TESTAR: 1, APROVAR: 2 };
const numberValue = (value, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
};

function validateInput(body) {
  if (!body || typeof body !== 'object') throw new Error('Corpo da requisição inválido.');
  const product = String(body.product || '').trim();
  const offer = String(body.offer || '').trim();
  const audience = String(body.audience || '').trim();
  if (!product || !offer || !audience) throw new Error('Preencha produto, oferta e público-alvo.');
  const ticket = numberValue(body.ticket);
  const monthlyBudget = numberValue(body.monthlyBudget);
  if (ticket <= 0 || monthlyBudget <= 0) throw new Error('Ticket e verba mensal precisam ser maiores que zero.');
  const informedMaxCpa = body.informedMaxCpa === null || body.informedMaxCpa === '' || body.informedMaxCpa === undefined
    ? null : numberValue(body.informedMaxCpa);
  return {
    platform: ['meta','google','tiktok'].includes(String(body.platform)) ? body.platform : 'meta',
    objective: ['sales','leads','whatsapp','traffic'].includes(String(body.objective)) ? body.objective : 'sales',
    businessType: String(body.businessType || 'E-commerce'), product, offer, audience,
    location: String(body.location || 'Brasil'), differential: String(body.differential || ''),
    proof: String(body.proof || ''), brandTone: String(body.brandTone || 'Direto e profissional'),
    destinationUrl: String(body.destinationUrl || ''), trackingStatus: String(body.trackingStatus || 'none'),
    availableAssets: String(body.availableAssets || ''), restrictions: String(body.restrictions || ''),
    ticket, costOfGoods: numberValue(body.costOfGoods), paymentFeesPercent: numberValue(body.paymentFeesPercent),
    taxesPercent: numberValue(body.taxesPercent), shippingCost: numberValue(body.shippingCost),
    refundPercent: numberValue(body.refundPercent), desiredProfitPercent: numberValue(body.desiredProfitPercent, 15),
    monthlyBudget, monthlyRevenueGoal: numberValue(body.monthlyRevenueGoal), informedMaxCpa,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  if (!requireAuth(req, res)) return;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
  try {
    const input = validateInput(req.body);
    const financials = calculateFinancials(input);
    const payload = await callGemini({
  apiKey,
  model: process.env.GEMINI_TEXT_MODEL,
  prompt: buildStrategyPrompt(input, financials),
  generationConfig: {
    responseMimeType: 'application/json',
    responseJsonSchema: strategyJsonSchema,
  },
});
    const raw = extractText(payload);
    if (!raw) throw new Error('O Gemini retornou uma resposta vazia.');
    const strategy = JSON.parse(raw);
    if (!strategy.verdict || verdictRank[strategy.verdict] > verdictRank[financials.deterministicVerdict]) {
      strategy.verdict = financials.deterministicVerdict;
      strategy.verdictReason = financials.deterministicReason;
    }
    strategy.campaign.dailyBudget = Math.round(input.monthlyBudget / 30 * 100) / 100;
    return res.status(200).json({ input, financials, strategy, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Falha ao gerar campanha.' });
  }
}

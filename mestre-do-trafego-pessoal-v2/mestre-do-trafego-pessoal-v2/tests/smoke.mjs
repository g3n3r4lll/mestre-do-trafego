import analyze from '../api/analyze.js';
import generateImage from '../api/generate-image.js';

process.env.GEMINI_API_KEY = 'test-key';
delete process.env.APP_PASSWORD;

const strategy = {
  verdict: 'APROVAR', verdictReason: 'ok', executiveSummary: 'Resumo',
  campaign: { platform: 'Meta Ads', objective: 'Vendas', campaignType: 'Vendas', campaignName: 'Campanha teste', conversionEvent: 'Purchase', budgetStrategy: 'ABO', dailyBudget: 20, testDurationDays: 7, bidStrategy: 'Menor custo', attribution: '7 dias clique', placements: 'Advantage+' },
  offer: { diagnosis: 'ok', promise: 'promessa', mechanism: 'mecanismo', objections: ['objeção'], guarantee: 'Nenhuma garantia declarada' },
  audiences: [1, 2].map((i) => ({ name: `Público ${i}`, type: 'prospecção', description: 'descrição', include: ['Brasil'], exclude: ['Clientes'], notes: 'nota' })),
  ads: [1, 2, 3].map((i) => ({ name: `Anúncio ${i}`, angle: 'ângulo', primaryText: 'texto', headline: 'headline', description: 'descrição', cta: 'Saiba mais' })),
  creatives: [1, 2, 3].map((i) => ({ name: `Criativo ${i}`, format: '1:1', hook: 'gancho', script: ['cena'], visualDirection: 'direção', imagePrompt: 'professional advertising image without text' })),
  implementationSteps: Array.from({ length: 10 }, (_, i) => ({ order: i + 1, phase: 'Configuração', path: 'Menu', action: 'Ação', exactValue: 'Valor', validation: 'Validar' })),
  trackingChecklist: ['a', 'b', 'c', 'd'],
  optimizationRules: { first72Hours: ['observar'], killRules: ['cortar'], scaleRules: ['escalar'], remarketing: ['remarketing'] },
  landingOrWhatsApp: { headline: 'headline', structure: ['estrutura'], followUp: ['follow-up'] },
  risks: ['risco 1', 'risco 2'], namingConvention: 'PLATAFORMA_OBJETIVO_DATA',
};

function responseMock() {
  return {
    statusCode: 200, headers: {}, payload: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(key, value) { this.headers[key] = value; },
    json(payload) { this.payload = payload; return this; },
  };
}

global.fetch = async () => ({
  ok: true, status: 200,
  json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(strategy) }] } }] }),
});

const resultResponse = responseMock();
await analyze({
  method: 'POST', headers: {},
  body: {
    platform: 'meta', objective: 'sales', businessType: 'E-commerce', product: 'Produto teste',
    offer: 'Oferta completa', audience: 'Público definido', ticket: 449, costOfGoods: 80,
    paymentFeesPercent: 5, taxesPercent: 6, shippingCost: 0, refundPercent: 2,
    desiredProfitPercent: 20, monthlyBudget: 600, monthlyRevenueGoal: 5000,
    trackingStatus: 'none',
  },
}, resultResponse);

if (resultResponse.statusCode !== 200) throw new Error(JSON.stringify(resultResponse.payload));
if (resultResponse.payload.financials.deterministicVerdict !== 'TESTAR') throw new Error('Veredito financeiro inesperado.');
if (resultResponse.payload.strategy.verdict !== 'TESTAR') throw new Error('A estratégia ultrapassou o limite financeiro.');

global.fetch = async () => ({
  ok: true, status: 200,
  json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { data: 'aGVsbG8=', mimeType: 'image/png' } }] } }] }),
});

const imageResponse = responseMock();
await generateImage({
  method: 'POST', headers: {},
  body: { prompt: 'Create a professional ecommerce advertising image without text and with premium lighting.' },
}, imageResponse);

if (imageResponse.statusCode !== 200 || !imageResponse.payload.dataUrl?.startsWith('data:image/png;base64,')) {
  throw new Error('Falha no teste do contrato de imagem.');
}

console.log('Smoke tests concluídos: cálculo, limite de veredito e imagem.');

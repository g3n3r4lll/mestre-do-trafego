import analyze, { parseStrategy } from '../api/analyze.js';
import generateImage from '../api/generate-image.js';
import { groundStrategy } from '../api/_lib/grounding.js';

process.env.GEMINI_API_KEY = 'test-key';
delete process.env.APP_PASSWORD;

const repairedStrategy = parseStrategy(`{\n  \"campaign\": {\"name\": \"teste\",},\n  \"offer\": {guarantee: \"não informado\",},\n}`);
if (repairedStrategy.campaign.name !== 'teste' || repairedStrategy.offer.guarantee !== 'não informado') {
  throw new Error('Reparo de JSON quase válido falhou.');
}

const groundingProbe = groundStrategy({
  offer: {
    promise: 'Catálogo de alta conversão',
    mechanism: 'Tecnologia proprietária exclusiva',
    guarantee: 'Sem fidelidade e com demonstração prévia',
  },
  risks: ['Se o atendimento demorar mais de 15 minutos, o CPA subirá.'],
  ads: [{ description: 'Atendimento rápido pelo WhatsApp' }],
  landingOrWhatsApp: { followUp: ['Retorno imediato aos leads interessados.'] },
  creatives: [{ script: ['Imagem estática de alta conversão exibindo a oferta.'] }],
}, {
  product: 'Plano Growth da Modelize AI',
  offer: 'Transforme fotos simples em um catálogo profissional. Primeiro mês por R$ 449,00.',
  differential: 'Modelo virtual exclusiva e Copy & SEO por produto.',
  proof: 'Portfólio com antes e depois.',
  availableAssets: 'Site e Instagram.',
  restrictions: 'Não prometer aumento garantido de vendas.',
});

if (groundingProbe.offer.promise !== 'Transforme fotos simples em um catálogo profissional.') throw new Error('Promise não foi ancorada na oferta.');
if (groundingProbe.offer.mechanism !== 'Modelo virtual exclusiva e Copy & SEO por produto.') throw new Error('Mecanismo não foi ancorado no diferencial.');
if (!groundingProbe.offer.guarantee.includes('Nenhuma garantia')) throw new Error('Guardrail de garantia falhou.');
if (groundingProbe.risks[0].includes('15 minutos')) throw new Error('Guardrail de limite operacional inventado falhou.');
if (groundingProbe.ads[0].description !== 'Atendimento pelo WhatsApp') throw new Error('Guardrail de velocidade de atendimento falhou.');
if (groundingProbe.landingOrWhatsApp.followUp[0] !== 'Retorno aos leads interessados.') throw new Error('Guardrail de velocidade de follow-up falhou.');
if (groundingProbe.creatives[0].script[0].includes('alta conversão')) throw new Error('Guardrail de claim de conversão falhou.');

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

let imageRequestBody;
global.fetch = async (_url, options) => {
  imageRequestBody = JSON.parse(options.body);
  return {
    ok: true, status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { data: 'aGVsbG8=', mimeType: 'image/png' } }] } }] }),
  };
};

const imageResponse = responseMock();
await generateImage({
  method: 'POST', headers: {},
  body: { prompt: 'Create a professional ecommerce advertising image without text and with premium lighting.' },
}, imageResponse);

if (imageRequestBody?.response_format?.mime_type !== 'image/jpeg') throw new Error('Formato de imagem solicitado ao Gemini deve ser JPEG.');

if (imageResponse.statusCode !== 200 || !imageResponse.payload.dataUrl?.startsWith('data:image/png;base64,')) {
  throw new Error('Falha no teste do contrato de imagem.');
}

console.log('Smoke tests concluídos: cálculo, limite de veredito e imagem.');

import { calculateFinancials } from '/shared/finance.js';

const root = document.getElementById('root');
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

const defaultForm = {
  platform: 'meta', objective: 'sales', businessType: 'E-commerce', product: '', offer: '', audience: '',
  location: 'Brasil', differential: '', proof: '', brandTone: 'Direto, profissional e comercial',
  destinationUrl: '', trackingStatus: 'none', availableAssets: '', restrictions: '', ticket: 0,
  costOfGoods: 0, paymentFeesPercent: 4.99, taxesPercent: 6, shippingCost: 0, refundPercent: 2,
  desiredProfitPercent: 15, monthlyBudget: 600, monthlyRevenueGoal: 0, informedMaxCpa: null,
};

const state = {
  access: 'checking', view: 'form', tab: 'summary', form: { ...defaultForm }, result: null,
  history: [], loading: false, error: '', images: {}, imageLoading: null, copyStore: {}, copyIndex: 0,
};

const platformLabels = { meta: 'Meta Ads', google: 'Google Ads', tiktok: 'TikTok Ads' };
const objectiveLabels = { sales: 'Vendas', leads: 'Leads', whatsapp: 'WhatsApp', traffic: 'Tráfego qualificado' };

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}
function numeric(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function passwordHeader() { return sessionStorage.getItem('mestre_password') || ''; }

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-app-password': passwordHeader(), ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Falha HTTP ${response.status}`);
  return payload;
}

function copyButton(text, label = 'Copiar') {
  const id = `copy-${++state.copyIndex}`;
  state.copyStore[id] = text;
  return `<button type="button" class="ghost-button compact copy-button" data-copy="${id}"><span class="text-icon">▣</span>${esc(label)}</button>`;
}

function verdictBadge(verdict) {
  const symbol = verdict === 'APROVAR' ? '✓' : verdict === 'TESTAR' ? '!' : '×';
  return `<span class="verdict verdict-${String(verdict).toLowerCase()}"><b>${symbol}</b>${esc(verdict)}</span>`;
}

function metricCard(label, value, detail = '', tone = 'default') {
  return `<article class="metric-card metric-${tone}"><span>${esc(label)}</span><strong>${esc(value)}</strong>${detail ? `<small>${esc(detail)}</small>` : ''}</article>`;
}

function field(label, control, hint = '', wide = false) {
  return `<label class="field ${wide ? 'field-wide' : ''}"><span class="field-label">${esc(label)}</span>${control}${hint ? `<span class="field-hint">${esc(hint)}</span>` : ''}</label>`;
}

function sectionTitle(symbol, title, description) {
  return `<div class="section-title"><div class="section-icon"><span class="section-symbol">${symbol}</span></div><div><h2>${esc(title)}</h2><p>${esc(description)}</p></div></div>`;
}

function renderAccess() {
  root.innerHTML = `<main class="access-screen"><div class="access-card"><div class="brand-mark"><span class="logo-letter">M</span></div><span class="eyebrow">ACESSO PESSOAL</span><h1>Mestre do Tráfego</h1><p>Digite a senha configurada na hospedagem para acessar o planejador.</p><form id="access-form"><div class="input-with-icon"><span class="input-symbol">⌁</span><input autofocus name="password" type="password" placeholder="Senha da ferramenta"></div><div id="access-error"></div><button class="primary-button" type="submit"><span>↳</span>Entrar</button></form></div></main>`;
  document.getElementById('access-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button');
    const password = new FormData(event.currentTarget).get('password')?.toString() || '';
    button.disabled = true; button.textContent = 'Validando...';
    try {
      sessionStorage.setItem('mestre_password', password);
      await api('/api/auth', { method: 'POST', body: '{}' });
      state.access = 'ready'; render();
    } catch (error) {
      sessionStorage.removeItem('mestre_password');
      document.getElementById('access-error').innerHTML = `<div class="inline-error">${esc(error.message)}</div>`;
      button.disabled = false; button.innerHTML = '<span>↳</span>Entrar';
    }
  });
}

function topbar() {
  return `<header class="topbar no-print"><button class="brand" data-nav="form"><div class="brand-mark small"><span class="logo-letter small">M</span></div><div><strong>MESTRE DO TRÁFEGO</strong><span>Campaign Operating System</span></div></button><nav><button class="${state.view === 'form' ? 'active' : ''}" data-nav="form"><span class="nav-symbol">＋</span>Nova campanha</button><button class="${state.view === 'history' ? 'active' : ''}" data-nav="history"><span class="nav-symbol">◷</span>Histórico <b>${state.history.length}</b></button><button class="icon-button" data-action="lock" title="Bloquear">⌁</button></nav></header>`;
}

function renderFinance(metrics) {
  const warnings = metrics.warnings.length ? `<div class="warnings-list">${metrics.warnings.map((item) => `<p><b>!</b>${esc(item)}</p>`).join('')}</div>` : '';
  return `<div class="sticky-panel"><div class="panel-header"><div><span class="eyebrow">CÁLCULO EM TEMPO REAL</span><h3>Viabilidade financeira</h3></div><span class="panel-symbol">◎</span></div><div class="metrics-stack">${metricCard('Margem de contribuição', currency.format(metrics.contributionMargin), `${decimal.format(metrics.contributionMarginPercent)}% do ticket`, metrics.contributionMargin > 0 ? 'good' : 'danger')}${metricCard('CPA de equilíbrio', currency.format(metrics.breakEvenCpa), 'Acima disso há prejuízo por venda', 'warn')}${metricCard('CPA-alvo', currency.format(metrics.targetCpa), `ROAS-alvo: ${decimal.format(metrics.targetRoas)}`, 'good')}${metricCard('Verba mínima de teste', currency.format(metrics.minimumTestBudget), 'Referência para aproximadamente 5 aquisições')}${metricCard('Receita projetada', currency.format(metrics.monthlyRevenueEstimate), `${decimal.format(metrics.monthlyConversionsEstimate)} conversões estimadas`)}</div><div class="finance-verdict verdict-box-${metrics.deterministicVerdict.toLowerCase()}">${verdictBadge(metrics.deterministicVerdict)}<p>${esc(metrics.deterministicReason)}</p></div>${warnings}<small class="disclaimer">Projeções são referências de planejamento, não garantia de resultado.</small></div>`;
}

function formPage() {
  const f = state.form;
  const metrics = calculateFinancials(f);
  return `<div class="page-heading form-heading"><span class="eyebrow">PLANEJAMENTO ORIENTADO POR MARGEM</span><h1>Campanha pronta para executar.</h1><p>Informe os fundamentos. O sistema calcula o limite financeiro e monta estratégia, públicos, copy, criativos, rastreamento e operação.</p></div>${state.error ? `<div class="global-error"><b>!</b><span>${esc(state.error)}</span><button data-action="clear-error">×</button></div>` : ''}<div class="page-grid"><form class="campaign-form" id="campaign-form">
  <section class="form-card">${sectionTitle('◉','Campanha e oferta','Defina o que será vendido, para quem e em qual plataforma.')}<div class="fields-grid">
    ${field('Plataforma', `<select name="platform"><option value="meta" ${f.platform === 'meta' ? 'selected' : ''}>Meta Ads</option><option value="google" ${f.platform === 'google' ? 'selected' : ''}>Google Ads</option><option value="tiktok" ${f.platform === 'tiktok' ? 'selected' : ''}>TikTok Ads</option></select>`)}
    ${field('Objetivo principal', `<select name="objective"><option value="sales" ${f.objective === 'sales' ? 'selected' : ''}>Vendas</option><option value="leads" ${f.objective === 'leads' ? 'selected' : ''}>Captação de leads</option><option value="whatsapp" ${f.objective === 'whatsapp' ? 'selected' : ''}>Conversas no WhatsApp</option><option value="traffic" ${f.objective === 'traffic' ? 'selected' : ''}>Tráfego qualificado</option></select>`)}
    ${field('Modelo de negócio', `<select name="businessType">${['E-commerce','Serviço local','Prestação de serviço','Infoproduto','SaaS','Imobiliário','Outro'].map((v) => `<option ${f.businessType === v ? 'selected' : ''}>${v}</option>`).join('')}</select>`)}
    ${field('Região atendida', `<input name="location" value="${esc(f.location)}" placeholder="Ex.: São Paulo/SP ou Brasil">`)}
    ${field('Produto ou serviço', `<input required name="product" value="${esc(f.product)}" placeholder="Ex.: Ensaio virtual para lojas de moda feminina">`, '', true)}
    ${field('Oferta atual', `<textarea required name="offer" placeholder="Ex.: 20 imagens profissionais por R$ 449 no primeiro mês...">${esc(f.offer)}</textarea>`, 'Inclua preço, condição, bônus, prazo e qualquer limite real.', true)}
    ${field('Público-alvo', `<textarea required name="audience" placeholder="Ex.: Donas de lojas femininas com catálogo online...">${esc(f.audience)}</textarea>`, 'Descreva perfil, dor, intenção e momento de compra.', true)}
    ${field('Diferencial principal', `<textarea name="differential" placeholder="Por que a oferta é melhor ou diferente?">${esc(f.differential)}</textarea>`, '', true)}
    ${field('Provas disponíveis', `<textarea name="proof" placeholder="Resultados, depoimentos, antes e depois, portfólio...">${esc(f.proof)}</textarea>`, '', true)}
  </div></section>
  <section class="form-card">${sectionTitle('R$','Economia unitária','Esses números definem o CPA e o ROAS máximos. Não chute custos.')}<div class="fields-grid three-columns">
    ${field('Ticket médio', `<input required name="ticket" min="0" step="0.01" type="number" value="${f.ticket || ''}">`)}
    ${field('Custo do produto/entrega', `<input name="costOfGoods" min="0" step="0.01" type="number" value="${f.costOfGoods || ''}">`)}
    ${field('Frete subsidiado', `<input name="shippingCost" min="0" step="0.01" type="number" value="${f.shippingCost || ''}">`)}
    ${field('Taxas de pagamento (%)', `<input name="paymentFeesPercent" min="0" max="100" step="0.01" type="number" value="${f.paymentFeesPercent}">`)}
    ${field('Impostos (%)', `<input name="taxesPercent" min="0" max="100" step="0.01" type="number" value="${f.taxesPercent}">`)}
    ${field('Devoluções/perdas (%)', `<input name="refundPercent" min="0" max="100" step="0.01" type="number" value="${f.refundPercent}">`)}
    ${field('Lucro desejado após mídia (%)', `<input name="desiredProfitPercent" min="0" max="100" step="0.1" type="number" value="${f.desiredProfitPercent}">`)}
    ${field('CPA máximo já conhecido', `<input name="informedMaxCpa" min="0" step="0.01" type="number" value="${f.informedMaxCpa ?? ''}">`, 'Opcional. Deixe vazio para o sistema calcular.')}
  </div></section>
  <section class="form-card">${sectionTitle('▥','Verba, rastreamento e ativos','A campanha será montada de acordo com a infraestrutura disponível hoje.')}<div class="fields-grid">
    ${field('Verba mensal de mídia', `<input required name="monthlyBudget" min="1" step="0.01" type="number" value="${f.monthlyBudget || ''}">`)}
    ${field('Meta mensal de faturamento', `<input name="monthlyRevenueGoal" min="0" step="0.01" type="number" value="${f.monthlyRevenueGoal || ''}">`)}
    ${field('Rastreamento atual', `<select name="trackingStatus"><option value="none" ${f.trackingStatus === 'none' ? 'selected' : ''}>Nenhum rastreamento</option><option value="pixel" ${f.trackingStatus === 'pixel' ? 'selected' : ''}>Pixel/tag instalado, sem evento validado</option><option value="events" ${f.trackingStatus === 'events' ? 'selected' : ''}>Eventos principais validados</option><option value="server" ${f.trackingStatus === 'server' ? 'selected' : ''}>Pixel/tag + integração server-side</option></select>`)}
    ${field('Tom da marca', `<input name="brandTone" value="${esc(f.brandTone)}">`)}
    ${field('URL ou destino', `<input name="destinationUrl" value="${esc(f.destinationUrl)}" placeholder="https://... ou WhatsApp da operação">`, '', true)}
    ${field('Ativos disponíveis', `<textarea name="availableAssets" placeholder="Fotos, vídeos, depoimentos, UGC, catálogo, logo...">${esc(f.availableAssets)}</textarea>`, '', true)}
    ${field('Restrições e observações', `<textarea name="restrictions" placeholder="Palavras proibidas, regiões excluídas, limitações...">${esc(f.restrictions)}</textarea>`, '', true)}
  </div></section>
  <button class="primary-button large" type="submit" ${state.loading ? 'disabled' : ''}>${state.loading ? '<span class="spinner-dot"></span>Construindo campanha...' : '<span>✦</span>Gerar campanha completa'}</button>
  </form><aside class="finance-panel" id="finance-panel">${renderFinance(metrics)}</aside></div>`;
}

function readForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const numericFields = ['ticket','costOfGoods','paymentFeesPercent','taxesPercent','shippingCost','refundPercent','desiredProfitPercent','monthlyBudget','monthlyRevenueGoal'];
  numericFields.forEach((key) => { data[key] = numeric(data[key]); });
  data.informedMaxCpa = data.informedMaxCpa === '' ? null : numeric(data.informedMaxCpa);
  return data;
}

function definition(label, value) { return `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`; }
function list(items = [], className = 'check-list') { return `<ul class="${className}">${items.map((item) => `<li><b>✓</b>${esc(item)}</li>`).join('')}</ul>`; }
function textBlock(label, text, large = false) { return `<div class="text-block"><span>${esc(label)}</span><p class="${large ? 'large-copy' : ''}">${esc(text)}</p></div>`; }

function summaryTab(result) {
  const s = result.strategy, f = result.financials;
  return `<div class="result-content"><section class="hero-result"><div><span class="eyebrow">VEREDITO OPERACIONAL</span><h2>${esc(s.campaign.campaignName)}</h2><p>${esc(s.executiveSummary)}</p></div>${verdictBadge(s.verdict)}</section><div class="metric-grid">${metricCard('Verba diária', currency.format(s.campaign.dailyBudget))}${metricCard('CPA-alvo', currency.format(f.targetCpa),'','good')}${metricCard('ROAS-alvo', decimal.format(f.targetRoas))}${metricCard('Teste inicial', `${s.campaign.testDurationDays} dias`)}${metricCard('Conversões estimadas', decimal.format(f.monthlyConversionsEstimate))}${metricCard('Contribuição após mídia', currency.format(f.monthlyContributionAfterAds),'',f.monthlyContributionAfterAds >= 0 ? 'good' : 'danger')}</div><section class="content-card"><h3><span class="heading-symbol">◎</span>Decisão e estrutura</h3><p class="lead-text">${esc(s.verdictReason)}</p><div class="definition-grid">${definition('Plataforma',s.campaign.platform)}${definition('Tipo',s.campaign.campaignType)}${definition('Objetivo',s.campaign.objective)}${definition('Conversão',s.campaign.conversionEvent)}${definition('Lance',s.campaign.bidStrategy)}${definition('Atribuição',s.campaign.attribution)}${definition('Orçamento',s.campaign.budgetStrategy)}${definition('Posicionamentos',s.campaign.placements)}</div></section><section class="content-card"><h3><span class="heading-symbol">↗</span>Oferta recomendada</h3>${textBlock('Diagnóstico',s.offer.diagnosis)}${textBlock('Promessa',s.offer.promise)}${textBlock('Mecanismo',s.offer.mechanism)}${textBlock('Garantia ou redução de risco',s.offer.guarantee)}<div class="chip-list">${s.offer.objections.map((item) => `<span>${esc(item)}</span>`).join('')}</div></section><section class="content-card"><h3><span class="heading-symbol">!</span>Riscos que precisam ser controlados</h3>${list(s.risks,'check-list danger-list')}</section></div>`;
}

function setupTab(strategy) {
  const audiences = strategy.audiences.map((a) => `<article class="audience-card"><span class="pill">${esc(a.type)}</span><h4>${esc(a.name)}</h4><p>${esc(a.description)}</p><div class="mini-section"><strong>Incluir</strong>${a.include.map((x) => `<span>+ ${esc(x)}</span>`).join('')}</div><div class="mini-section"><strong>Excluir</strong>${a.exclude.map((x) => `<span>− ${esc(x)}</span>`).join('')}</div><small>${esc(a.notes)}</small></article>`).join('');
  return `<div class="result-content"><section class="content-card"><div class="card-heading-row"><h3><span class="heading-symbol">◉</span>Públicos e segmentação</h3>${copyButton(JSON.stringify(strategy.audiences,null,2),'Copiar públicos')}</div><div class="audience-grid">${audiences}</div></section><section class="content-card"><h3><span class="heading-symbol">✓</span>Rastreamento antes de publicar</h3>${list(strategy.trackingChecklist)}</section><section class="content-card"><h3><span class="heading-symbol">#</span>Convenção de nomes</h3><div class="copy-box"><code>${esc(strategy.namingConvention)}</code>${copyButton(strategy.namingConvention)}</div></section></div>`;
}

function copyTab(strategy) {
  const ads = strategy.ads.map((ad) => `<article class="ad-card"><div class="card-heading-row"><div><span class="pill">${esc(ad.angle)}</span><h4>${esc(ad.name)}</h4></div>${copyButton(`${ad.primaryText}\n\n${ad.headline}\n${ad.description}\nCTA: ${ad.cta}`)}</div><div class="ad-copy"><span>Texto principal</span><p>${esc(ad.primaryText)}</p></div><div class="ad-copy"><span>Headline</span><strong>${esc(ad.headline)}</strong></div><div class="ad-copy"><span>Descrição</span><p>${esc(ad.description)}</p></div><div class="cta-preview">${esc(ad.cta)}<b>›</b></div></article>`).join('');
  const creatives = strategy.creatives.map((c,index) => `<article class="creative-card"><div class="creative-visual">${state.images[index] ? `<img src="${state.images[index]}" alt="${esc(c.name)}">` : '<span class="empty-image-symbol">▧</span>'}<span>${esc(c.format)}</span></div><div class="creative-body"><div class="card-heading-row"><div><small>CRIATIVO ${index+1}</small><h4>${esc(c.name)}</h4></div><button class="ghost-button compact generate-image" data-index="${index}" ${state.imageLoading === index ? 'disabled' : ''}>${state.imageLoading === index ? 'Gerando...' : '✦ Gerar imagem'}</button></div>${textBlock('Gancho',c.hook)}${textBlock('Direção visual',c.visualDirection)}<ol class="script-list">${c.script.map((line,i) => `<li><b>${i+1}</b>${esc(line)}</li>`).join('')}</ol><div class="prompt-box"><p>${esc(c.imagePrompt)}</p>${copyButton(c.imagePrompt,'Copiar prompt')}</div></div></article>`).join('');
  return `<div class="result-content">${state.error ? `<div class="global-error"><b>!</b><span>${esc(state.error)}</span></div>` : ''}<section class="content-card"><h3><span class="heading-symbol">A</span>Anúncios prontos</h3><div class="ads-grid">${ads}</div></section><section class="content-card"><h3><span class="heading-symbol">✦</span>Plano de criativos</h3><div class="creative-grid">${creatives}</div></section><section class="content-card"><h3><span class="heading-symbol">▥</span>Página ou fluxo comercial</h3>${textBlock('Headline',strategy.landingOrWhatsApp.headline,true)}<div class="two-list-grid"><div><h4>Estrutura</h4><ol class="number-list">${strategy.landingOrWhatsApp.structure.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div><div><h4>Follow-up</h4><ol class="number-list">${strategy.landingOrWhatsApp.followUp.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div></div></section></div>`;
}

function stepsTab(steps) {
  const sorted = [...steps].sort((a,b) => a.order-b.order);
  const copyText = sorted.map((s) => `${s.order}. ${s.phase}\nCaminho: ${s.path}\nAção: ${s.action}\nValor: ${s.exactValue}\nValidar: ${s.validation}`).join('\n\n');
  return `<div class="result-content"><section class="content-card"><div class="card-heading-row"><div><h3><span class="heading-symbol">≡</span>Passo a passo de implementação</h3><p class="subtitle">Execute na ordem. Só avance quando a validação estiver concluída.</p></div>${copyButton(copyText,'Copiar roteiro')}</div><div class="timeline">${sorted.map((s) => `<article class="timeline-step"><div class="step-number">${s.order}</div><div class="step-content"><span class="pill">${esc(s.phase)}</span><h4>${esc(s.action)}</h4><dl><div><dt>Caminho</dt><dd>${esc(s.path)}</dd></div><div><dt>Valor exato</dt><dd>${esc(s.exactValue)}</dd></div><div><dt>Validar</dt><dd>${esc(s.validation)}</dd></div></dl></div></article>`).join('')}</div></section></div>`;
}

function ruleColumn(title, items, tone, symbol) { return `<article class="rule-column rule-${tone}"><h4><b>${symbol}</b>${esc(title)}</h4><ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></article>`; }
function optimizationTab(strategy) { const r=strategy.optimizationRules; return `<div class="result-content"><section class="content-card"><h3><span class="heading-symbol">↗</span>Operação e otimização</h3><div class="rules-grid">${ruleColumn('Primeiras 72 horas',r.first72Hours,'neutral','◎')}${ruleColumn('Regras de corte',r.killRules,'danger','×')}${ruleColumn('Regras de escala',r.scaleRules,'good','↑')}${ruleColumn('Remarketing',r.remarketing,'warn','↻')}</div></section></div>`; }

function resultPage() {
  const r = state.result, s = r.strategy;
  const tabContent = state.tab === 'summary' ? summaryTab(r) : state.tab === 'setup' ? setupTab(s) : state.tab === 'copy' ? copyTab(s) : state.tab === 'steps' ? stepsTab(s.implementationSteps) : optimizationTab(s);
  const all = copyButton(JSON.stringify(r,null,2),'Copiar tudo');
  return `<div class="result-page"><div class="result-toolbar no-print"><button class="ghost-button" data-nav="form">← Voltar</button><div class="toolbar-actions">${all}<button class="ghost-button" data-action="print">⇩ Salvar PDF</button><button class="primary-button compact-primary" data-action="new">＋ Nova campanha</button></div></div><div class="result-titlebar"><div><span class="eyebrow">${platformLabels[r.input.platform]} · ${objectiveLabels[r.input.objective]}</span><h1>${esc(r.input.product)}</h1></div><span class="generated-date">Gerada em ${new Date(r.generatedAt).toLocaleString('pt-BR')}</span></div><nav class="tabs no-print">${[['summary','Resumo'],['setup','Configuração'],['copy','Copy & criativos'],['steps','Passo a passo'],['optimization','Otimização']].map(([value,label]) => `<button class="${state.tab===value?'active':''}" data-tab="${value}">${label}</button>`).join('')}</nav>${tabContent}</div>`;
}

function historyPage() {
  const cards = state.history.map((item) => `<article class="history-card"><div class="history-card-top"><span>${platformLabels[item.input.platform]}</span>${verdictBadge(item.strategy.verdict)}</div><h3>${esc(item.input.product)}</h3><p>${esc(item.strategy.executiveSummary)}</p><div class="history-numbers"><span>Verba: ${currency.format(item.input.monthlyBudget)}</span><span>CPA: ${currency.format(item.financials.targetCpa)}</span></div><div class="history-actions"><button class="primary-button compact-primary" data-open-history="${esc(item.generatedAt)}">Abrir</button><button class="icon-button danger" data-delete-history="${esc(item.generatedAt)}">×</button></div></article>`).join('');
  return `<div class="history-page"><div class="page-heading"><span class="eyebrow">ARMAZENAMENTO LOCAL</span><h1>Histórico de campanhas</h1><p>As últimas análises ficam salvas apenas neste navegador.</p></div>${state.history.length ? `<div class="history-grid">${cards}</div>` : '<div class="empty-state"><span class="empty-history-symbol">◷</span><h3>Nenhuma campanha salva</h3><p>Gere a primeira campanha para iniciar o histórico.</p></div>'}</div>`;
}

function render() {
  state.copyStore = {}; state.copyIndex = 0;
  if (state.access === 'checking') { root.innerHTML = '<main class="loading-screen"><span class="spinner-large"></span><p>Validando ambiente...</p></main>'; return; }
  if (state.access === 'locked') { renderAccess(); return; }
  const content = state.view === 'form' ? formPage() : state.view === 'result' && state.result ? resultPage() : historyPage();
  root.innerHTML = `<div class="app-shell">${topbar()}<main class="main-area">${content}</main></div>`;
  bindGlobal();
  if (state.view === 'form') bindForm();
  if (state.view === 'result') bindResult();
  if (state.view === 'history') bindHistory();
}

function bindGlobal() {
  document.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => { state.view = button.dataset.nav; state.error = ''; render(); }));
  document.querySelector('[data-action="lock"]')?.addEventListener('click', () => { sessionStorage.removeItem('mestre_password'); state.access='locked'; render(); });
  document.querySelector('[data-action="clear-error"]')?.addEventListener('click', () => { state.error=''; render(); });
  document.querySelectorAll('.copy-button').forEach((button) => button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(state.copyStore[button.dataset.copy] || '');
    const old=button.innerHTML; button.textContent='✓ Copiado'; setTimeout(()=>{button.innerHTML=old;},1200);
  }));
}

function bindForm() {
  const form = document.getElementById('campaign-form');
  const refresh = () => { state.form = readForm(form); document.getElementById('finance-panel').innerHTML = renderFinance(calculateFinancials(state.form)); };
  form.addEventListener('input', refresh); form.addEventListener('change', refresh);
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); state.form = readForm(form); state.loading=true; state.error=''; render();
    try {
      const result = await api('/api/analyze', { method:'POST', body:JSON.stringify(state.form) });
      state.result=result; state.images={}; state.tab='summary'; state.view='result';
      state.history=[result,...state.history.filter((x)=>x.generatedAt!==result.generatedAt)].slice(0,8);
      localStorage.setItem('mestre_campaign_history',JSON.stringify(state.history));
      window.scrollTo({top:0,behavior:'smooth'});
    } catch (error) {
      if (String(error.message).toLowerCase().includes('senha')) state.access='locked';
      else state.error=error.message;
    } finally { state.loading=false; render(); }
  });
}

function bindResult() {
  document.querySelectorAll('[data-tab]').forEach((button)=>button.addEventListener('click',()=>{state.tab=button.dataset.tab; state.error=''; render();}));
  document.querySelector('[data-action="print"]')?.addEventListener('click',()=>window.print());
  document.querySelector('[data-action="new"]')?.addEventListener('click',()=>{state.form={...defaultForm};state.result=null;state.view='form';state.error='';render();});
  document.querySelectorAll('.generate-image').forEach((button)=>button.addEventListener('click',async()=>{
    const index=Number(button.dataset.index); const prompt=state.result.strategy.creatives[index].imagePrompt;
    state.imageLoading=index; state.error=''; render();
    try { const payload=await api('/api/generate-image',{method:'POST',body:JSON.stringify({prompt})}); state.images[index]=payload.dataUrl; }
    catch(error){ state.error=error.message; }
    finally { state.imageLoading=null; render(); }
  }));
}

function bindHistory() {
  document.querySelectorAll('[data-open-history]').forEach((button)=>button.addEventListener('click',()=>{state.result=state.history.find((x)=>x.generatedAt===button.dataset.openHistory);state.view='result';state.tab='summary';state.images={};render();}));
  document.querySelectorAll('[data-delete-history]').forEach((button)=>button.addEventListener('click',()=>{state.history=state.history.filter((x)=>x.generatedAt!==button.dataset.deleteHistory);localStorage.setItem('mestre_campaign_history',JSON.stringify(state.history));render();}));
}

async function init() {
  try { const stored=localStorage.getItem('mestre_campaign_history'); if(stored) state.history=JSON.parse(stored); } catch { localStorage.removeItem('mestre_campaign_history'); }
  render();
  try { await api('/api/auth',{method:'POST',body:'{}'}); state.access='ready'; }
  catch { state.access='locked'; }
  render();
}

init();

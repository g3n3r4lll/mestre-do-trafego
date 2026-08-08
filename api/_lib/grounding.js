const RISK_REVERSAL_PATTERN = /\b(garantia|reembolso|fidelidade|cancelamento|demonstra(?:ç|c)[aã]o|pr[eé]via|amostra|teste gr[aá]tis|gratuit[oa])\b/i;

function asText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function firstSentence(value) {
  const text = asText(value);
  if (!text) return '';
  const match = text.match(/^.*?(?:[.!?](?=\s|$)|$)/);
  return asText(match?.[0] || text);
}

function sourceSentence(value, pattern) {
  return asText(value)
    .split(/(?<=[.!?])\s+/)
    .find((sentence) => pattern.test(sentence)) || '';
}

function unsupportedRiskThreshold(risk, input) {
  const text = asText(risk);
  const threshold = text.match(/\b(?:mais|menos)\s+de\s+\d+(?:[.,]\d+)?\s*(?:minutos?|horas?)\b/i)?.[0];
  if (!threshold) return false;
  const declared = [input.offer, input.differential, input.proof, input.availableAssets, input.restrictions]
    .map(asText).join(' ').toLowerCase();
  return !declared.includes(threshold.toLowerCase());
}

function sanitizeUnsupportedServiceSpeed(value, input) {
  const declared = [
    input.offer,
    input.differential,
    input.proof,
    input.availableAssets,
    input.restrictions,
  ].map(asText).join(' ');
  const hasDeclaredSpeed = /\b(?:atendimento|resposta|retorno)\s+(?:r[aá]pid[oa]s?|imediat[oa]s?)\b/i.test(declared);
  const hasDeclaredHighConversion = /\balta\s+convers[aã]o\b/i.test(declared);

  const sanitize = (item) => {
    if (typeof item === 'string') {
      let text = item;
      if (!hasDeclaredSpeed) {
        text = text.replace(/\b(atendimento|resposta|retorno)\s+(?:r[aá]pid[oa]s?|imediat[oa]s?)\b/gi, '$1');
      }
      if (!hasDeclaredHighConversion) {
        text = text
          .replace(/\s+de\s+alta\s+convers[aã]o\b/gi, '')
          .replace(/\balta\s+convers[aã]o\b/gi, 'conversão a validar');
      }
      return text;
    }
    if (Array.isArray(item)) return item.map(sanitize);
    if (item && typeof item === 'object') {
      for (const [key, nested] of Object.entries(item)) item[key] = sanitize(nested);
    }
    return item;
  };

  return sanitize(value);
}

export function groundStrategy(strategy, input) {
  if (!strategy || typeof strategy !== 'object') return strategy;
  if (!strategy.offer || typeof strategy.offer !== 'object') return strategy;

  const groundedPromise = firstSentence(input.offer);
  if (groundedPromise) strategy.offer.promise = groundedPromise;

  const differential = asText(input.differential);
  strategy.offer.mechanism = differential
    ? differential
    : `O briefing descreve a oferta como ${asText(input.product)}. Nenhum mecanismo técnico adicional foi informado.`;

  const guaranteeSource = sourceSentence(input.offer, RISK_REVERSAL_PATTERN);
  strategy.offer.guarantee = guaranteeSource
    ? `Condição informada no briefing: ${guaranteeSource}`
    : 'Nenhuma garantia, política de reembolso, fidelidade, cancelamento, demonstração ou amostra foi informada. Não anunciar essas condições sem confirmação do negócio.';

  if (Array.isArray(strategy.risks)) {
    strategy.risks = strategy.risks.map((risk) => unsupportedRiskThreshold(risk, input)
      ? 'A velocidade e a qualidade do atendimento podem afetar a conversão; o briefing não informa um limite de tempo específico.'
      : risk);
  }

  return sanitizeUnsupportedServiceSpeed(strategy, input);
}

const safe = (value) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
const round = (value) => Math.round(value * 100) / 100;

export function calculateFinancials(input) {
  const ticket = safe(input.ticket);
  const percentageCosts = ticket * safe(
    safe(input.paymentFeesPercent) + safe(input.taxesPercent) + safe(input.refundPercent),
  ) / 100;
  const variableCosts = safe(input.costOfGoods) + safe(input.shippingCost) + percentageCosts;
  const contributionMargin = ticket - variableCosts;
  const contributionMarginPercent = ticket > 0 ? contributionMargin / ticket * 100 : 0;
  const desiredProfit = ticket * safe(input.desiredProfitPercent) / 100;
  const breakEvenCpa = Math.max(0, contributionMargin);
  const targetCpa = Math.max(0, contributionMargin - desiredProfit);
  const informed = input.informedMaxCpa && Number(input.informedMaxCpa) > 0
    ? Number(input.informedMaxCpa)
    : null;
  const operatingCpa = informed ?? targetCpa;
  const breakEvenRoas = breakEvenCpa > 0 ? ticket / breakEvenCpa : 0;
  const targetRoas = targetCpa > 0 ? ticket / targetCpa : 0;
  const salesToGoal = ticket > 0 && safe(input.monthlyRevenueGoal) > 0
    ? Math.ceil(safe(input.monthlyRevenueGoal) / ticket)
    : 0;
  const budgetRequiredForGoal = salesToGoal * targetCpa;
  const monthlyConversionsEstimate = operatingCpa > 0
    ? safe(input.monthlyBudget) / operatingCpa
    : 0;
  const monthlyRevenueEstimate = monthlyConversionsEstimate * ticket;
  const monthlyContributionAfterAds = monthlyConversionsEstimate * contributionMargin - safe(input.monthlyBudget);
  const minimumTestBudget = Math.max(targetCpa * 5, safe(input.monthlyBudget) > 0 ? safe(input.monthlyBudget) / 4 : 0);

  const warnings = [];
  let deterministicVerdict = 'APROVAR';
  let deterministicReason = 'A matemática permite teste controlado dentro do CPA-alvo.';

  if (ticket <= 0) {
    deterministicVerdict = 'BLOQUEAR';
    deterministicReason = 'Ticket inválido.';
  } else if (contributionMargin <= 0) {
    deterministicVerdict = 'BLOQUEAR';
    deterministicReason = 'A margem de contribuição é negativa antes do investimento em mídia.';
  } else if (targetCpa <= 0) {
    deterministicVerdict = 'BLOQUEAR';
    deterministicReason = 'A margem desejada consome toda a margem disponível para aquisição.';
  } else if (informed && informed > breakEvenCpa) {
    deterministicVerdict = 'BLOQUEAR';
    deterministicReason = 'O CPA informado está acima do CPA de equilíbrio e produz prejuízo por venda.';
  } else if ((informed && informed > targetCpa) || safe(input.monthlyBudget) < targetCpa * 5) {
    deterministicVerdict = 'TESTAR';
    deterministicReason = safe(input.monthlyBudget) < targetCpa
      ? 'A verba mensal é menor que uma aquisição no CPA-alvo. Execute apenas um teste exploratório e não trate ausência de vendas como conclusão estatística.'
      : 'A operação exige teste controlado porque o CPA informado ou o volume disponível reduz a margem de segurança.';
  }

  if (contributionMarginPercent < 25) warnings.push('Margem de contribuição abaixo de 25%.');
  if (input.trackingStatus === 'none') warnings.push('Não há rastreamento de conversão configurado.');
  if (!String(input.proof || '').trim()) warnings.push('Oferta sem prova declarada.');
  if (!String(input.destinationUrl || '').trim()) warnings.push('Destino da campanha não informado.');
  if (salesToGoal > 0 && budgetRequiredForGoal > safe(input.monthlyBudget)) {
    warnings.push('A verba mensal é inferior à verba estimada para alcançar a meta de faturamento.');
  }

  return {
    variableCosts: round(variableCosts),
    contributionMargin: round(contributionMargin),
    contributionMarginPercent: round(contributionMarginPercent),
    breakEvenCpa: round(breakEvenCpa),
    targetCpa: round(targetCpa),
    operatingCpa: round(operatingCpa),
    breakEvenRoas: round(breakEvenRoas),
    targetRoas: round(targetRoas),
    salesToGoal,
    budgetRequiredForGoal: round(budgetRequiredForGoal),
    monthlyConversionsEstimate: round(monthlyConversionsEstimate),
    monthlyRevenueEstimate: round(monthlyRevenueEstimate),
    monthlyContributionAfterAds: round(monthlyContributionAfterAds),
    minimumTestBudget: round(minimumTestBudget),
    deterministicVerdict,
    deterministicReason,
    warnings,
  };
}

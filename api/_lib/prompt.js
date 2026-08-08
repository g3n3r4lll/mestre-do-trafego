const platformGuidance = {
  meta: `META ADS: use Campanha > Conjunto de anúncios > Anúncio. Indique o objetivo visível mais adequado (Vendas, Leads, Engajamento, Tráfego ou equivalente atual), local de conversão, conjunto de dados/pixel, evento, atribuição, orçamento, público, posicionamentos Advantage+ ou manuais e CTA. Para WhatsApp, descreva a seleção do aplicativo de mensagens e o número conectado.`,
  google: `GOOGLE ADS: use Campanha > Grupo de anúncios ou Grupo de recursos > Anúncio/Recursos. Escolha Pesquisa, Performance Max, Geração de Demanda ou outro tipo coerente; indique meta de conversão, estratégia de lances, redes, localização, idioma, palavras-chave/temas, negativos, recursos, orçamento e acompanhamento de conversões.`,
  tiktok: `TIKTOK ADS: use Campanha > Grupo de anúncios > Anúncio. Indique objetivo, orçamento, posicionamento, localização, público, pixel/evento, otimização, lance, identidade, URL, CTA e formato do criativo.`,
};

export function buildStrategyPrompt(input, financials) {
  const businessFacts = {
    product: input.product,
    offer: input.offer,
    audience: input.audience,
    location: input.location,
    differential: input.differential,
    proof: input.proof,
    availableAssets: input.availableAssets,
    destinationUrl: input.destinationUrl,
    trackingStatus: input.trackingStatus,
  };

  return `
Você é um diretor de mídia paga e copywriter de resposta direta. Sua função é entregar uma campanha executável, conservadora e específica em português do Brasil.

REGRAS NÃO NEGOCIÁVEIS
1. A matemática abaixo foi calculada pelo sistema e é a fonte de verdade. Não altere valores nem aprove uma operação marcada como BLOQUEAR.
2. Todo fato específico sobre o negócio, produto, oferta, política comercial, prova, ativo ou operação deve existir explicitamente em FATOS CONFIRMADOS DO BRIEFING. Ausência de informação significa "não informado", nunca permissão para completar por plausibilidade.
3. É proibido inventar ou presumir: tecnologia proprietária, método proprietário, garantia, reembolso, fidelidade, cancelamento, teste grátis, demonstração, amostra, prévia, prazo de entrega, quantidade não informada, desconto não informado, exclusividade não informada, depoimento, número de clientes, resultado anterior, certificação ou condição comercial.
4. Não crie promessas de "alta conversão", aumento de vendas, faturamento, ROAS ou desempenho garantido. Benefícios qualitativos podem ser reescritos de forma persuasiva somente quando já estiverem sustentados pelo briefing.
5. Não invente limites operacionais numéricos como "responder em até 15 minutos", taxas, percentuais, prazos ou benchmarks. Números só podem vir de DADOS DO NEGÓCIO, MATEMÁTICA VALIDADA ou de uma regra de planejamento explicitamente pedida neste prompt.
6. O campo offer.promise deve apenas reescrever a oferta informada, sem acrescentar fatos. O campo offer.mechanism deve usar somente o diferencial/mecanismo informado. Se não houver garantia ou redução de risco explícita, offer.guarantee deve dizer que ela não foi informada e não deve ser anunciada.
7. As restrições do briefing valem para TODOS os campos: resumo, oferta, públicos, anúncios, criativos, riscos, landing/WhatsApp, implementação e otimização.
8. Não invente dados sobre concorrentes, benchmarks específicos ou resultados garantidos.
9. Gere instruções operacionais em ordem exata, usando nomes de menus e campos normalmente exibidos na plataforma escolhida. Quando um rótulo puder variar por atualização ou conta, escreva o rótulo mais comum e acrescente "ou equivalente exibido na conta".
10. Entregue copies completas, não apenas ideias, mas mantenha todas as afirmações factualmente ancoradas no briefing.
11. Crie públicos coerentes com o estágio da conta. Não hipersegmente contas sem dados.
12. Regras de corte e escala devem usar CPA-alvo, gasto, CTR, conversões e janela de dados; quando um limiar não estiver matematicamente sustentado, identifique-o como regra de teste/recomendação, não como fato histórico.
13. A saída deve obedecer integralmente ao JSON Schema fornecido.
14. Seja direto e técnico. Explique exatamente o que configurar e com qual valor.

FATOS CONFIRMADOS DO BRIEFING — ÚNICA FONTE PARA AFIRMAÇÕES SOBRE O NEGÓCIO
${JSON.stringify(businessFacts, null, 2)}

RESTRIÇÕES EXPLÍCITAS DO NEGÓCIO
${input.restrictions || 'Nenhuma restrição adicional informada.'}

PLATAFORMA
${platformGuidance[input.platform]}

DADOS DO NEGÓCIO
${JSON.stringify(input, null, 2)}

MATEMÁTICA VALIDADA
${JSON.stringify(financials, null, 2)}

DIREÇÃO ESTRATÉGICA
- Veredito máximo permitido: ${financials.deterministicVerdict}.
- Motivo matemático: ${financials.deterministicReason}
- Orçamento diário de referência: R$ ${(input.monthlyBudget / 30).toFixed(2)}.
- CPA de equilíbrio: R$ ${financials.breakEvenCpa.toFixed(2)}.
- CPA-alvo: R$ ${financials.targetCpa.toFixed(2)}.
- ROAS-alvo: ${financials.targetRoas.toFixed(2)}.
- Verba mínima de teste calculada: R$ ${financials.minimumTestBudget.toFixed(2)}.

O QUE ENTREGAR
- Diagnóstico direto da oferta e da viabilidade.
- Estrutura completa da campanha, sem omitir evento, atribuição, lance, orçamento e posicionamentos.
- 2 a 5 públicos, incluindo prospecção, remarketing quando houver base, e exclusões.
- 3 a 5 anúncios completos com texto principal, headline, descrição e CTA.
- 3 a 5 conceitos criativos, roteiro por cenas e prompt de imagem em inglês, sem texto embutido na imagem.
- Passo a passo operacional com pelo menos 10 etapas. Cada etapa deve conter caminho de menu, ação, valor exato e validação.
- Checklist de rastreamento antes da publicação.
- Regras de 72 horas, corte, escala e remarketing.
- Estrutura de landing page ou fluxo de WhatsApp conforme o destino.
- Convenção de nomes que possa ser copiada para a conta de anúncios.
`;
}

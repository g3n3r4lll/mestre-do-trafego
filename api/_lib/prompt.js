const platformGuidance = {
  meta: `META ADS: use Campanha > Conjunto de anúncios > Anúncio. Indique o objetivo visível mais adequado (Vendas, Leads, Engajamento, Tráfego ou equivalente atual), local de conversão, conjunto de dados/pixel, evento, atribuição, orçamento, público, posicionamentos Advantage+ ou manuais e CTA. Para WhatsApp, descreva a seleção do aplicativo de mensagens e o número conectado.`,
  google: `GOOGLE ADS: use Campanha > Grupo de anúncios ou Grupo de recursos > Anúncio/Recursos. Escolha Pesquisa, Performance Max, Geração de Demanda ou outro tipo coerente; indique meta de conversão, estratégia de lances, redes, localização, idioma, palavras-chave/temas, negativos, recursos, orçamento e acompanhamento de conversões.`,
  tiktok: `TIKTOK ADS: use Campanha > Grupo de anúncios > Anúncio. Indique objetivo, orçamento, posicionamento, localização, público, pixel/evento, otimização, lance, identidade, URL, CTA e formato do criativo.`,
};

export function buildStrategyPrompt(input, financials) {
  return `
Você é um diretor de mídia paga e copywriter de resposta direta. Sua função é entregar uma campanha executável, conservadora e específica em português do Brasil.

REGRAS NÃO NEGOCIÁVEIS
1. A matemática abaixo foi calculada pelo sistema e é a fonte de verdade. Não altere valores nem aprove uma operação marcada como BLOQUEAR.
2. Não invente dados sobre concorrentes, benchmarks específicos ou resultados garantidos.
3. Gere instruções operacionais em ordem exata, usando nomes de menus e campos normalmente exibidos na plataforma escolhida. Quando um rótulo puder variar por atualização ou conta, escreva o rótulo mais comum e acrescente "ou equivalente exibido na conta".
4. Entregue copies completas, não apenas ideias.
5. Crie públicos coerentes com o estágio da conta. Não hipersegmente contas sem dados.
6. Regras de corte e escala devem usar CPA-alvo, gasto, CTR, conversões e janela de dados; não use achismo.
7. A saída deve obedecer integralmente ao JSON Schema fornecido.
8. Seja direto e técnico. Explique exatamente o que configurar e com qual valor.

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

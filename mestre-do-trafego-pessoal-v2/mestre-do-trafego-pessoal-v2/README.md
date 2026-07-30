# Mestre do Tráfego — versão pessoal

Ferramenta privada para transformar os dados de uma oferta em uma campanha de mídia paga executável.

A aplicação calcula a viabilidade financeira sem depender da IA e usa o Gemini para produzir estratégia, estrutura da campanha, públicos, copies, conceitos criativos, prompts visuais, checklist de rastreamento, regras de otimização e um passo a passo operacional por plataforma.

## O que a ferramenta entrega

- diagnóstico financeiro com margem de contribuição;
- CPA de equilíbrio e CPA-alvo;
- ROAS mínimo e ROAS-alvo;
- estimativa de vendas, faturamento e resultado após mídia;
- veredito `APROVAR`, `TESTAR` ou `BLOQUEAR`;
- estrutura de campanha para Meta Ads, Google Ads ou TikTok Ads;
- públicos de prospecção e remarketing;
- anúncios completos com texto principal, headline, descrição e CTA;
- conceitos de imagem e vídeo com roteiro por cenas;
- prompts visuais em inglês;
- passo a passo numerado com caminho de menu, ação, valor e validação;
- regras de primeiras 72 horas, corte, escala e remarketing;
- histórico local das últimas campanhas;
- impressão ou salvamento em PDF;
- geração opcional de imagem pelo Gemini.

## Arquitetura

A chave do Gemini fica apenas no servidor. O navegador chama funções em `/api`, portanto a credencial não é incorporada ao JavaScript público.

O projeto não possui dependências npm. Ele usa HTML, CSS, JavaScript e funções Node.js compatíveis com Vercel.

## Executar no computador

Requisitos:

- Node.js 20 ou superior;
- uma chave do Google AI Studio.

1. Copie `.env.example` para `.env.local`.
2. Preencha:

```env
GEMINI_API_KEY=sua_chave_do_google_ai_studio
APP_PASSWORD=sua_senha_pessoal
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
```

3. Execute:

```bash
npm run check
npm run dev
```

4. Abra:

```text
http://localhost:3000
```

## Publicar na Vercel

### 1. Criar o repositório

Crie um repositório **privado** no GitHub, por exemplo:

```text
mestre-do-trafego
```

Envie todos os arquivos deste projeto, exceto `.env.local`.

### 2. Importar na Vercel

1. Entre na Vercel.
2. Selecione `Add New` > `Project`.
3. Importe o repositório privado.
4. Não configure framework nem comando de build.
5. Em `Environment Variables`, adicione:
   - `GEMINI_API_KEY`;
   - `APP_PASSWORD`;
   - `GEMINI_TEXT_MODEL` com `gemini-2.5-flash`;
   - `GEMINI_IMAGE_MODEL` com `gemini-2.5-flash-image`.
6. Clique em `Deploy`.

Depois da publicação, a página exigirá a senha configurada em `APP_PASSWORD`.

## Como preencher para receber uma campanha útil

Use valores reais. O diagnóstico perde valor quando custos, taxas ou oferta são aproximados sem critério.

Campos financeiros:

- `Ticket`: valor médio efetivamente pago;
- `Custo do produto/serviço`: custo direto da entrega;
- `Taxas`: gateway, marketplace ou plataforma;
- `Impostos`: percentual efetivo sobre a venda;
- `Frete subsidiado`: parte do frete paga pelo negócio;
- `Devoluções`: perda média estimada;
- `Lucro desejado`: margem que deve permanecer depois da mídia;
- `CPA informado`: opcional; use apenas quando houver histórico confiável;
- `Verba mensal`: total realmente disponível para mídia.

Campos estratégicos:

- descreva a oferta completa, não apenas o nome do produto;
- informe público, localização e principal diferencial;
- inclua provas existentes e restrições da oferta;
- informe o destino real: página, checkout, formulário ou WhatsApp;
- selecione corretamente o estado do rastreamento.

## Limites da automação

A ferramenta prepara a campanha, mas não publica diretamente nas contas de anúncios. A publicação automática exigiria integrações separadas com Meta Marketing API, Google Ads API ou TikTok Business API, além de tokens, permissões e contas comerciais aprovadas.

As instruções operacionais são geradas com base na plataforma selecionada. Interfaces de gerenciadores de anúncios mudam; quando um rótulo não existir exatamente, use o campo equivalente exibido na conta e valide o objetivo, evento, orçamento e destino antes de publicar.

## Segurança

- não envie `.env.local` ao GitHub;
- mantenha o repositório privado;
- configure `APP_PASSWORD` na Vercel;
- revogue a chave se ela já tiver sido publicada anteriormente;
- não compartilhe o endereço e a senha da aplicação.

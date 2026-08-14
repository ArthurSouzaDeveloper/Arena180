# Plano de Implementação — Plataforma de Contratação de Barbeiros Freelancer v1

Baseado em: `2026-08-14-barbershop-freelancer-platform-design.md`

## Fase 0 — Setup do projeto

1. Inicializar projeto Next.js (TypeScript) + Tailwind CSS na raiz do repo.
2. Configurar Postgres local (docker-compose) + ORM (Prisma).
3. Configurar lint/format (ESLint + Prettier) e scripts de teste (Vitest/Jest).
4. Estrutura de pastas: `app/` (rotas), `lib/` (lógica de domínio), `prisma/` (schema/migrações),
   `components/` (UI).

## Fase 1 — Modelo de dados e autenticação

1. Criar schema Prisma com as entidades do spec: `Usuario`, `PerfilBarbeiro`,
   `PortfolioFoto`, `Contratacao`, `Pagamento`, `Avaliacao`, `Conversa`, `Mensagem`.
2. Rodar migração inicial.
3. Autenticação e-mail/senha (ex: NextAuth com Credentials Provider), com campo `tipo`
   (`barbearia` | `barbeiro`) definindo o onboarding.
4. Telas de cadastro separadas: Barbearia (nome, CNPJ opcional, endereço) e Barbeiro
   (CPF, dados pessoais).
5. Teste: fluxo de cadastro/login para os dois tipos de usuário.

## Fase 2 — Perfil de barbeiro e busca

1. Tela de edição de perfil do barbeiro: experiência, especialidades, cidade/bairro,
   raio de atendimento, valor da diária padrão.
2. Upload de portfólio de fotos (armazenamento em serviço de blob, ex: S3/Cloudflare R2).
3. Listagem/busca de barbeiros com filtro por cidade/raio, especialidade e faixa de preço.
4. Página pública de perfil do barbeiro (visão da barbearia): dados + portfólio + nota média.
5. Teste: filtros de busca retornam os barbeiros corretos; perfil exibe dados completos.

## Fase 3 — Fluxo de contratação (sem pagamento ainda)

1. Tela da barbearia para solicitar contratação (data(s) + valor calculado com comissão).
2. Lógica de cálculo de comissão (12% configurável) — função pura testável isoladamente.
3. Painel do barbeiro com pedidos pendentes: aceitar / recusar, com prazo de expiração
   automática (job agendado ou verificação lazy na leitura).
4. Painel da barbearia com status dos pedidos enviados.
5. Teste: transições de status da `Contratacao` (pendente → aceita/recusada/expirada).
6. Teste unitário: cálculo de comissão para vários valores de entrada.

## Fase 4 — Integração de pagamento (Mercado Pago)

1. Onboarding OAuth do barbeiro com Mercado Pago (vincula `mp_account_id`); bloquear
   disponibilidade do barbeiro até essa etapa ser concluída.
2. Ao aceite da contratação, criar cobrança via Mercado Pago Checkout Transparente com
   split de pagamento (valor barbeiro / comissão plataforma).
3. Webhook do Mercado Pago para atualizar `Pagamento.status_split` e mover
   `Contratacao.status` para `paga`.
4. Testes de integração com mocks da API do Mercado Pago; validação manual em sandbox MP.

## Fase 5 — Chat pós-contratação

1. Criar `Conversa` automaticamente quando `Contratacao.status` vira `paga`.
2. Servidor WebSocket (Socket.io) para mensagens em tempo real, autenticado por sessão.
3. UI de chat (texto simples) acessível a partir do painel de contratações ativas.
4. Regra de acesso: usuário só entra na conversa se for parte da `Contratacao`
   correspondente e o status permitir.
5. Teste: mensagens só trafegam entre as partes corretas; chat bloqueado antes do pagamento.

## Fase 6 — Conclusão e avaliação

1. Ação para marcar `Contratacao` como `concluida` (barbearia, após a data do serviço).
2. Tela de avaliação (nota 1–5 + comentário) vinculada à contratação concluída.
3. Atualizar `nota_media`/`total_avaliacoes` do `PerfilBarbeiro` ao salvar avaliação.
4. Teste: cálculo de nota média; avaliação só permitida uma vez por contratação.

## Fase 7 — Identidade visual e polimento

1. Aplicar tema (preto/dourado, tipografia serifada nos títulos) em todas as telas.
2. Cards de barbeiro em grid, badges de especialidade, estrelas de avaliação.
3. Dashboard da barbearia com lista de contratações + aba de chat lateral.
4. Revisão de responsividade (PC, tablet, celular via browser).

## Fora de escopo (confirmado no spec)

Chat com anexos, disputas/reembolso, verificação de antecedentes, app nativo,
múltiplas filiais por barbearia, painel administrativo para ajustar comissão.

## Ordem de execução recomendada

Fase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7, cada fase com commit próprio e testes passando antes
de avançar para a próxima.

# Plataforma de Contratação de Barbeiros Freelancer — Design v1

## Contexto e objetivo

Marketplace onde barbearias contratam barbeiros freelancer para períodos determinados
(ex: um final de semana). O barbeiro define seu valor pela diária/período; a plataforma
soma uma comissão de 12% sobre esse valor e cobra o total da barbearia contratante via
Mercado Pago, repassando automaticamente a parte do barbeiro por split de pagamento.

Exemplo: barbeiro pede R$250 → plataforma exibe R$280 para a barbearia → no pagamento,
R$250 vai para o barbeiro e R$30 para a plataforma, automaticamente.

Esta é a primeira sub-etapa de um projeto maior (cadastro + marketplace + contratação +
pagamento + chat). Fases futuras não cobertas aqui: reputação avançada, disputas/reembolso,
chat com mídia, app mobile nativo.

## Escopo desta v1

- Cadastro de duas personas: **Barbearia** (contratante) e **Barbeiro** (freelancer).
- Perfil de barbeiro com experiência, especialidades, localização/raio de atendimento,
  portfólio de fotos e avaliações/nota média.
- Busca/listagem de barbeiros filtrável por localização e disponibilidade.
- Fluxo de contratação: pedido → aceite/recusa do barbeiro → pagamento → conclusão → avaliação.
- Pagamento via Mercado Pago com split automático (comissão de 12%, configurável).
- Chat de texto liberado somente após a contratação ser paga.
- Layout com identidade visual de barbearia (tema escuro + dourado).

Fora de escopo nesta v1: chat com envio de arquivos/fotos, sistema de disputa/reembolso,
verificação de antecedentes, app mobile nativo, múltiplas filiais por barbearia.

## Arquitetura e stack

- **Front-end:** Next.js (React) + Tailwind CSS. Web responsivo — mesma base de código
  atende PC, tablet e celular via browser. Sem app nativo nesta v1.
- **Back-end:** API routes do Next.js ou serviço Node/Express dedicado; PostgreSQL como
  banco relacional.
- **Chat em tempo real:** WebSocket (Socket.io) ou serviço gerenciado (ex: Supabase
  Realtime) — mensagens de texto simples, sem anexos nesta v1.
- **Pagamento:** Mercado Pago — Checkout Transparente/Marketplace com split de pagamento.
  Cada barbeiro conecta sua conta Mercado Pago via OAuth no onboarding; sem isso ele não
  pode ficar disponível para contratação (bloqueio de fluxo).
- **Autenticação:** e-mail/senha, duas personas distintas com onboarding separado
  (Barbearia: nome do estabelecimento, CNPJ opcional, endereço; Barbeiro: CPF, dados
  pessoais, conexão OAuth Mercado Pago).

## Modelo de dados (entidades principais)

- **Usuario**: id, tipo (`barbearia` | `barbeiro`), nome, e-mail, telefone, senha_hash.
- **PerfilBarbeiro**: usuario_id, anos_experiencia, especialidades[], cidade, bairro,
  raio_atendimento_km, valor_diaria_padrao, mp_account_id (conta Mercado Pago vinculada),
  nota_media, total_avaliacoes.
- **PortfolioFoto**: id, perfil_barbeiro_id, url_imagem, ordem.
- **Contratacao**: id, barbearia_id, barbeiro_id, data_inicio, data_fim, valor_barbeiro,
  valor_comissao, valor_total, status (`pendente` → `aceita`|`recusada` → `paga` →
  `concluida` → `avaliada`), criado_em.
- **Pagamento**: id, contratacao_id, mp_payment_id, valor_total, valor_repassado_barbeiro,
  valor_comissao_plataforma, status_split.
- **Avaliacao**: id, contratacao_id, nota (1–5), comentario, criado_em.
- **Conversa**: id, contratacao_id (1:1) — só existe/é acessível quando `Contratacao.status`
  é `paga`, `concluida` ou `avaliada`.
- **Mensagem**: id, conversa_id, remetente_id, texto, criado_em.

## Fluxo principal

1. Barbearia busca barbeiros filtrando por cidade/raio, especialidade e disponibilidade
   de datas.
2. Barbearia envia pedido de contratação com data(s) e vê o valor total (diária + 12%).
3. Barbeiro recebe o pedido e tem um prazo (ex: 24h) para aceitar ou recusar. Pedidos não
   respondidos no prazo expiram automaticamente.
4. Ao aceitar, a barbearia é cobrada via Mercado Pago pelo valor total.
5. O Mercado Pago processa o split automaticamente: valor do barbeiro cai na conta dele,
   comissão cai na conta da plataforma. `Contratacao.status` vira `paga`.
6. O chat de texto entre barbearia e barbeiro é liberado.
7. Após a data do serviço, a contratação pode ser marcada como `concluida` e a barbearia
   avalia o barbeiro (nota + comentário), fechando o ciclo.

Se o barbeiro recusa ou o prazo expira, nenhuma cobrança ocorre e o pedido é encerrado
como `recusada`.

## Comissão

- Percentual fixo de **12%** sobre o valor definido pelo barbeiro, somado ao valor exibido
  para a barbearia (o barbeiro sempre recebe o valor cheio que ele pediu).
- Valor de comissão armazenado como configuração (não hardcoded), para permitir ajuste
  futuro sem alterar código — mas sem interface de administração nesta v1 (ajuste manual
  na configuração).

## Direção visual

Tema escuro/masculino clássico de barbearia: fundo preto/grafite com dourado/âmbar como
cor de destaque (remete a poste de barbeiro, couro, navalha). Tipografia com serifa forte
para títulos (estilo "vintage barbershop") combinada com sans-serif limpa para corpo de
texto. Cards de barbeiro em grid com foto de destaque, badges de especialidade, nota em
estrelas. Dashboard da barbearia lista pedidos ativos com aba de chat lateral quando
aplicável.

## Testes

- Testes unitários de cálculo de comissão (valor barbeiro → valor total exibido).
- Testes de fluxo de status da `Contratacao` (transições válidas/inválidas).
- Testes de integração do split de pagamento com mocks da API do Mercado Pago
  (ambiente de sandbox do MP para testes end-to-end antes de produção).
- Teste manual do fluxo completo na sandbox do Mercado Pago antes do lançamento.

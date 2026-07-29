# Agendamento público, quadras físicas e painel de superadmin

Status: aprovado pelo usuário em conversa, pronto para implementação.

## Contexto

O GestQuadra hoje modela cada cliente do SaaS como uma `Quadra` (tenant), com um único preço de
locação (`hourlyRate`/`extraBlockMinutes`/`extraBlockPrice`) e nenhuma forma de o dono cadastrar
múltiplas quadras físicas (a maioria dos societys tem Quadra 1, 2, 3...). Todo agendamento hoje é
manual: o dono usa a calculadora "Nova racha" quando o grupo já está no local. Não existe nenhum
fluxo para o jogador reservar um horário sozinho, nem um jeito do dono cadastrar novas
arenas/societys sem eu rodar um script de linha de comando manualmente.

Esta spec cobre três frentes, a serem construídas nesta ordem porque cada uma é pré-requisito da
seguinte:

1. Renomear o conceito de tenant de `Quadra` para `Arena` e criar um painel de superadmin real.
2. Modelar quadras físicas (`Court`) dentro de uma arena, com preço próprio por quadra.
3. Fluxo público de agendamento (sem login do jogador) que vira uma Racha automaticamente.

## Fora de escopo (explicitamente adiado)

- Confirmação/lembrete por e-mail ou SMS para o jogador — não existe infra de envio no projeto
  hoje; o jogador vê a confirmação só na tela.
- Cobrança/depósito no ato do agendamento (PIX) — já era fora de escopo do MVP original.
- Conta/login de verdade para o jogador — só nome + telefone, sem senha, sem sessão.
- Horário de funcionamento diferente por dia da semana — uma janela única por arena
  (ex: 08:00–23:00) valendo todos os dias.
- Preço/catálogo de produto variando por quadra física — produtos continuam por arena (confirmado
  pelo usuário).

## Parte 1 — Renomeação Quadra → Arena e painel de superadmin

### Rename mecânico
- Tabela `quadras` → `arenas`; modelo Prisma `Quadra` → `Arena`.
- Toda referência a `quadraId` no schema, services, rotas e middlewares (`User.quadraId`,
  `Product.quadraId`, `Racha.quadraId`, `req.user.quadraId`, `requireQuadra`) passa a `arenaId` /
  `requireArena`.
- Payload do JWT muda a chave `quadraId` → `arenaId`. Isso invalida sessões existentes (usuários
  precisam logar de novo uma vez); nenhum dado é perdido.
- Rotas HTTP que hoje usam `/api/quadra/settings` são substituídas pelas rotas de `Court` (parte 2)
  — não existe mais um "preço único da arena" para configurar.
- Frontend: todo texto/label "Quadra" nas telas do dono vira "Arena" quando se referir ao tenant;
  "Quadra 1/2/3" (Court) continua usando a palavra "quadra" normalmente, já que ali é o significado
  natural em português.

### Superadmin
- `Role.SUPERADMIN` já existe no schema (sem uso real hoje). Um usuário `SUPERADMIN` não tem
  `arenaId` (fica `null`, mesmo padrão que já existe) e só acessa as rotas de superadmin.
- Seed do superadmin (`arthurasp810@gmail.com`) é criado via migration/script de deploy, fora do
  repositório — a senha não é commitada em texto puro em nenhum arquivo versionado.
- Novas rotas, protegidas por `authenticate` + `authorize('SUPERADMIN')`:
  - `GET /api/superadmin/arenas` — lista arenas (nome, slug, ativa/inativa, e-mail do admin).
  - `POST /api/superadmin/arenas` — cria arena + primeiro usuário ADMIN em uma transação
    (`{ name, slug, adminName, adminEmail, adminPassword }`).
  - `PATCH /api/superadmin/arenas/:id` — ativa/desativa uma arena (soft — não deleta dados).
- Frontend: ao logar, se `role === 'SUPERADMIN'`, o app renderiza um layout separado (sem
  Produtos/Rachas/Configurações) com só "Arenas": lista + formulário de criação.

## Parte 2 — Quadras físicas (`Court`)

### Modelo de dados
```
model Court {
  id                String   @id @default(uuid())
  arenaId           String
  arena             Arena    @relation(fields: [arenaId], references: [id], onDelete: Cascade)
  name              String   // "Quadra 1", "Quadra 2"...
  hourlyRate        Decimal  @db.Decimal(10, 2)
  extraBlockMinutes Int
  extraBlockPrice   Decimal  @db.Decimal(10, 2)
  active            Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  rachas Racha[]

  @@index([arenaId])
  @@map("courts")
}
```
- Os campos `hourlyRate`/`extraBlockMinutes`/`extraBlockPrice` saem de `Arena` e passam a existir
  só em `Court` (cada quadra física tem seu próprio preço, conforme decidido).
- `Product` continua com `arenaId` (renomeado de `quadraId`) — catálogo por arena, não por quadra.
- `Racha` ganha:
  - `courtId: String` (obrigatório) — qual quadra física.
  - `arenaId` continua existindo em `Racha` (denormalizado a partir de `Court.arenaId`) para manter
    o mesmo padrão de isolamento multi-tenant já auditado (todo service filtra por
    `{ id, arenaId }` sem precisar dar join em `Court` para checar propriedade).
  - `numberOfPlayers: Int?` (era obrigatório, vira opcional — fica em branco até o dono fechar a
    conta).
  - `durationMinutes: Int?` — duração reservada, em minutos. Necessário para o cálculo de
    conflito de horário (parte 3): sem saber quanto tempo uma racha ocupa a quadra, não dá pra
    calcular se um novo agendamento colide com ela. Preenchido sempre que a racha nasce com
    `courtId` (tanto manual via calculadora de tempo quanto via agendamento público).
  - `bookedByName: String?`, `bookedByPhone: String?` — preenchidos só quando a racha nasce de um
    agendamento público.
  - `source: RachaSource @default(MANUAL)` com `enum RachaSource { MANUAL PUBLIC_BOOKING }` — para
    a lista de rachas do dono distinguir a origem.
- Migration: cria `courts`, migra os valores atuais de preço de cada `Arena` para uma `Court`
  única chamada "Quadra 1" por arena (para não deixar arenas existentes sem nenhuma quadra
  cadastrada), associa toda `Racha` existente a essa `Court`, preenche `arenaId` em `Racha` a
  partir do dado que já existe hoje.

### Telas do dono
- Configurações deixa de editar um preço único e passa a ser "Quadras": lista de `Court` da arena,
  cada uma com nome + os 3 campos de preço + ativa/inativa; botão para adicionar quadra nova.
- Nova Racha ganha um seletor "Quadra" no topo (lista as `Court` ativas da arena).
- Lista de Rachas ganha uma coluna "Quadra" e um badge de origem (Manual / Agendamento).
- Racha em aberto vinda de agendamento mostra `bookedByName`/`bookedByPhone` na tela de detalhe,
  para o dono saber quem reservou antes de preencher o número de jogadores.
- Racha ganha uma ação de exclusão (hoje não existe nenhuma forma de apagar uma racha criada por
  engano ou um agendamento indesejado/no-show) — soma pequena e resolve uma lacuna já identificada
  antes desta spec.

## Parte 3 — Agendamento público

### Link e navegação
- `seusite.com/agendar/:arenaSlug` — página pública, sem autenticação, fora do layout autenticado
  (sem sidebar/login).
- Fluxo: escolher quadra ativa → escolher data → ver grade de horários de início livres (granularidade
  fixa de 30 min, dentro da janela de funcionamento da arena) com os ocupados desabilitados →
  escolher duração (1h, 1h30, 2h...) respeitando o próximo horário ocupado → ver preço calculado ao
  vivo (mesma fórmula já usada na calculadora do dono) → preencher nome + telefone → confirmar → tela
  de confirmação com os dados (sem envio de e-mail/SMS).

### Novos campos de configuração (Arena)
```
bookingOpenTime  String  @default("08:00")  // "HH:mm"
bookingCloseTime String  @default("23:00")  // "HH:mm"
```
Editável na tela de Configurações do dono (uma janela só, valendo todos os dias).

### API pública (sem autenticação, mas com rate limiting dedicado)
- `GET /api/public/arenas/:slug` — nome da arena, janela de funcionamento, lista de `Court` ativas
  (id, nome) — nenhum dado sensível.
- `GET /api/public/arenas/:slug/availability?courtId=&date=YYYY-MM-DD` — retorna a janela de
  funcionamento e a lista de intervalos ocupados (`{ startsAt, endsAt }`) daquela quadra naquele
  dia. O front usa isso para desenhar a grade e desabilitar horários/durações que colidiriam; o
  cálculo real de conflito acontece de novo no passo seguinte.
- `POST /api/public/arenas/:slug/bookings` — `{ courtId, startsAt, durationMinutes, playerName,
  playerPhone }`. O servidor:
  1. Valida que a `Court` pertence à arena do slug e está ativa.
  2. Valida que o horário pedido está dentro da janela de funcionamento.
  3. Recalcula o preço a partir de `durationMinutes` e do preço da `Court` (nunca confia em preço
     vindo do cliente).
  4. Dentro de uma transação, reconfere que não há colisão com outra Racha na mesma `Court` +
     intervalo (proteção contra duas pessoas reservando o mesmo horário ao mesmo tempo) e só então
     cria a Racha (`status: ABERTO`, `source: PUBLIC_BOOKING`, `numberOfPlayers: null`).
  5. Se colidir, retorna 409 com mensagem clara ("Esse horário acabou de ser reservado, escolha
     outro").
- Rate limiting específico para as rotas públicas (mais permissivo que o de login, mais restrito
  que o geral autenticado) para conter abuso/spam de reservas fantasma.

### Não-decisões conscientes
- Cancelamento pelo próprio jogador não terá um link dedicado nesta fase (sem e-mail para reenviar
  o link, o jogador perderia o acesso). Quem cancela é o dono, pela ação de exclusão descrita na
  Parte 2.

# GestQuadra

Sistema de gestão para donos de quadras de society: controle de rachas, calculadora
automática de rateio entre jogadores e catálogo de produtos (bebidas/comidas) com foto.

---

## Funcionalidades desta fase

- **Acesso exclusivo do dono da quadra** (login com e-mail/senha). Não há acesso público para jogadores.
- **Catálogo de produtos**: cada quadra cadastra suas próprias bebidas e comidas, com nome, preço e foto.
- **Calculadora de racha**: informa o valor da quadra, o número de jogadores e o consumo do grupo — o
  sistema soma tudo e divide o total por jogador automaticamente.
- **Histórico de rachas**: todas as locações calculadas, com valor total e valor por jogador.
- **Painel com faturamento**: faturamento do dia, da semana e do mês, baseado nas rachas fechadas.
- **Multi-tenant**: cada quadra (cliente do SaaS) tem seus dados completamente isolados.

Fora de escopo nesta fase (planejado para depois): cobrança PIX real por jogador e acesso dos
jogadores via link próprio.

---

## Stack técnica

| Camada | Tecnologias |
|--------|-------------|
| Backend | Node.js, Express, TypeScript, Prisma, PostgreSQL |
| Frontend | React, TypeScript, Vite, TailwindCSS, React Router, Axios |
| Auth | JWT |
| Upload | Multer (armazenamento em disco) |
| Infra | Docker, Docker Compose |

Arquitetura em camadas (`config` → `domain` (Prisma) → `application/services` → `presentation`
(routes/middlewares)), seguindo o mesmo padrão do projeto irmão GestRest.

---

## Rodando com Docker (recomendado)

```bash
docker compose up --build
```

- Frontend: <http://localhost:8082>
- API: <http://localhost:4000/api>

Depois de subir os containers, crie a primeira quadra e seu usuário admin:

```bash
docker compose exec backend sh -c \
  "QUADRA_NAME='Arena Cillos' QUADRA_SLUG='arena-cillos' ADMIN_NAME='Fulano' ADMIN_EMAIL='dono@arenacillos.com.br' ADMIN_PASSWORD='senha123' node dist/scripts/create-quadra.js"
```

## Rodando localmente (dev)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate:dev
npm run quadra:create   # cria a primeira quadra + admin (ver variáveis de ambiente no script)
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Acesse <http://localhost:5173> e faça login com o e-mail/senha criados no passo `quadra:create`.

---

## Modelo de dados (resumo)

- **Quadra**: o tenant — cada cliente do SaaS.
- **User**: usuário admin vinculado a uma quadra (perfil único nesta fase).
- **Product**: bebida/comida cadastrada pela quadra, com preço e foto.
- **Racha**: uma locação/jogo — valor da quadra, número de jogadores, status (aberta/fechada).
- **RachaItem**: itens de consumo de uma racha, com preço travado no momento do lançamento.

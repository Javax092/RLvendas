# RL Burger SaaS

SaaS multi-tenant para cardapio digital, pedidos via WhatsApp e painel administrativo para restaurantes.

## Destaques da versao atual

- onboarding guiado com checklist de setup
- importacao automatica de cardapio por texto ou arquivo
- dashboard com analytics e economia estimada vs marketplace
- upsell visual no carrinho
- personalizacao visual de restaurante
- PWA instalavel

## Estrutura

- `frontend`: aplicacao React + Vite + Tailwind
- `backend`: API Express + Prisma + JWT
- `database`: infraestrutura local do PostgreSQL
- `docs`: arquitetura, roadmap e deploy

## Como rodar

1. Suba o banco:

```bash
cd database
docker compose up -d
```

2. Configure os ambientes:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Instale dependencias:

```bash
npm install
npm install --workspace backend
npm install --workspace frontend
```

4. Rode migrations e seed:

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

5. Inicie os apps:

```bash
npm run dev --workspace backend
npm run dev --workspace frontend
```

## Credenciais seed

- Email: `admin@rlburger.app`
- Senha: `123456`

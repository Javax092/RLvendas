# Arquitetura

## Visao geral

O produto foi estruturado como um SaaS multi-tenant com separacao clara entre:

- `frontend`: experiencia publica do cardapio e painel administrativo
- `backend`: API REST, autenticacao, regras de negocio e multi-tenant
- `database`: PostgreSQL local para desenvolvimento

## Multi-tenant

- Cada restaurante possui um `slug`
- O frontend publico usa a rota `/:restaurantSlug`
- Todas as entidades de negocio importantes referenciam `restaurantId`
- O backend filtra recursos administrativos pelo restaurante do usuario autenticado

## Modulos principais

- `Auth`: login JWT com senha hash
- `Catalog`: categorias, produtos e disponibilidade
- `Orders`: montagem de pedido, persistencia e exportacao para WhatsApp
- `Upsell`: sugestao baseada em regras, com espaco para evolucao com OpenAI
- `Settings`: numero do WhatsApp, tema e configuracoes do restaurante
- `Analytics`: captura de eventos simples de clique e checkout
- `Billing`: base pronta para integracao Stripe ou Mercado Pago

## Stack

- Frontend: React, TypeScript, Vite, Tailwind, React Router, Lucide
- Backend: Node.js, Express, TypeScript, Prisma, JWT, Zod, Multer
- Banco: PostgreSQL
- Deploy sugerido: Vercel + Railway/Render + Neon/Supabase

## Evolucao

1. Adicionar integracao real com provedor de pagamento
2. Adicionar OpenAI para upsell generativo
3. Implementar subdominios customizados
4. Adicionar webhooks de pedidos e analytics avancado


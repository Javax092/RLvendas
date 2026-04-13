# Estrutura de pastas

## Root

- `frontend/`: SPA React para cardapio publico e painel
- `backend/`: API Express, auth, pedidos, uploads e regra de negocio
- `database/`: docker compose para PostgreSQL local
- `docs/`: arquitetura, deploy e estrutura

## Frontend

- `src/pages/public`: telas do cardapio e pedido
- `src/pages/admin`: login e dashboard do restaurante
- `src/components`: UI reutilizavel
- `src/contexts`: estado de auth e carrinho
- `src/api`: clientes para backend

## Backend

- `src/controllers`: entrada das rotas
- `src/routes`: composicao da API
- `src/services`: WhatsApp, upsell e regras reutilizaveis
- `prisma/`: schema e seed


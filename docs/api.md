# API base

## Auth

- `POST /auth/login`
- `GET /auth/me`

## Catalogo

- `GET /menu/:slug`
- `GET /categories`
- `POST /categories`
- `PUT /categories/:id`
- `GET /products`
- `POST /products`
- `PUT /products/:id`

## Pedidos

- `POST /orders`
- `POST /orders/upsell`
- `GET /orders`

## Configuracoes

- `GET /settings`
- `PUT /settings`

## Analytics

- `POST /analytics`
- `GET /insights`

## Onboarding

- `GET /onboarding`

## Importacao de cardapio

- `POST /menu-import/preview`
- `POST /menu-import/text`
- `POST /menu-import/file`

## Billing

- `GET /billing/plans`

## Automacoes

- `GET /automations/whatsapp-templates`

## Upload

- `POST /uploads/image`

# Deploy

## Frontend

- Build command: `npm run build --workspace frontend`
- Output: `frontend/dist`
- Variaveis:
  - `VITE_API_URL`

## Backend

- Build command: `npm run build --workspace backend`
- Start command: `npm run start --workspace backend`
- Variaveis:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `PORT`
  - `APP_URL`

## Banco

- Neon ou Supabase PostgreSQL
- Executar `prisma migrate deploy`
- Executar `prisma db seed`


# Deploy

## Frontend

- Build command: `npm run build --workspace frontend`
- Output: `frontend/dist`
- Variaveis:
  - `VITE_API_URL=https://seu-backend.up.railway.app`
  - Root Directory na Vercel: `frontend`
  - Output Directory na Vercel: `dist`

## Backend

- Build command: `npm run build --workspace backend`
- Start command: `npm run start --workspace backend`
- Variaveis:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `JWT_SECRET`
  - `CORS_ORIGINS`
  - `PORT`
  - `FRONTEND_URL`

## Banco

- Neon ou Supabase PostgreSQL
- Executar `prisma migrate deploy`
- Executar `prisma db seed`

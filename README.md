# ClassVote

Votación de temas en tiempo real para las clases Mondo (Q&A) de RoninX Academy.
Cada cinturón tiene su propia URL y su propio ciclo de votación.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase, desplegado en Vercel.

## Desarrollo

```bash
cp .env.example .env.local   # completar las llaves
npm install
npm run dev
```

Chequeos: `npm run lint`, `npm run typecheck`, `npm run build`.

## Base de datos

- `migrations/0001_init.sql` — esquema + RLS (ya aplicado en Supabase).
- `seed.sql` — los 7 cinturones con su horario fijo (ya aplicado).

## Fases

1. ✅ Esqueleto Next.js + esquema Supabase + Vercel
2. ⬜ Vista del alumno: proponer/votar temas, conteo en tiempo real
3. ⬜ Panel del mentor (Supabase Auth)
4. ⬜ Cron de apertura/cierre automático del ciclo
5. ⬜ Enlazar `/votar/[slug]` en GHL

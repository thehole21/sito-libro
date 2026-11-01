# Sito libro — React + Node.js

Frontend React con Vite, API Node.js serverless per Vercel, database Neon Postgres.

## Vercel

Importa la repository `sito-libro`. Root Directory: `.`. Framework: Vite. Build: `npm run build`. Output: `dist`. Node.js: 22.

Per commenti e statistiche collega Neon, esegui `schema.sql` nel SQL Editor e aggiungi in Vercel `DATABASE_URL`, `ADMIN_PASSWORD` (almeno 16 caratteri) e `ANALYTICS_SECRET` (almeno 32 caratteri). Poi esegui il deploy.

Statistiche: `/api/admin`, utente `admin` e la password configurata. Nessun link pubblico. Il PDF funziona anche senza database.

## Locale

```sh
npm ci
npm run dev
```

Questo comando avvia il frontend. Per provare anche le API usa `npx vercel dev` dopo aver configurato `.env.local` dal modello `.env.example`.

```sh
npm run build
npm test
```

`src/` contiene i componenti React. `api/` contiene le funzioni Node.js. `public/` contiene PDF, copertina e configurazione audio. Non pubblicare `.env.local`, `node_modules/` o credenziali.

La procedura completa e i limiti tecnici sono in [LEGGIMI.md](LEGGIMI.md).

## Commenti privati

I visitatori possono inviare nome e commento, visibili solo al proprietario. Per leggerli apri `/api/admin` e seleziona **Leggi i commenti privati**, oppure visita `/api/admin-comments`. Usa utente `admin` e `ADMIN_PASSWORD`. Non servono modifiche allo schema del database.

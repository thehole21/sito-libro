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

## Audiolibro e statistiche di ascolto

Il file unificato è in public/audiolibro.m4a; l'ordine delle 12 parti originali è documentato in AUDIO.md. Il player registra le parti riprodotte, non solo la posizione raggiunta. In /api/admin sono visibili contatori e ultimi 100 dispositivi stimati, browser, sistema, sessioni, percentuale massima riprodotta e stato completo/parziale del mese. Completo significa almeno 98% in una sessione; sessioni diverse non si sommano. Un download o l'ascolto fuori dal player non vengono misurati. Il nome personale del dispositivo non è disponibile.

La tabella audio_sessions viene creata automaticamente usando DATABASE_URL. Se il ruolo Postgres non dispone del permesso CREATE, eseguire il nuovo schema.sql in Neon. Gli identificativi sono pseudonimi mensili, non identificativi hardware. La telemetria può essere incompleta in caso di blocchi di rete o chiusura forzata del browser; non dimostra attenzione o ascolto effettivo della persona. Le informazioni sono riservate all'amministratore.

## Dettagli delle visite

In /api/admin la sezione **Sessioni di visita** mostra ingresso, ultima attività, ultimo segnale e tempo attivo stimato. Gli orari sono in Europe/Rome. Sono elencate 100 visite per pagina, con navigazione alle precedenti del mese corrente. La tabella visit_sessions viene creata automaticamente; schema.sql contiene anche la creazione manuale. Nessuna variabile nuova.

La misurazione inizia dal nuovo deploy e non ricostruisce i dettagli delle vecchie visualizzazioni. Il contatore generale esistente resta invariato. Ogni apertura/ricaricamento crea una sessione in memoria, senza cookie. Il tempo cresce solo con pagina visibile e attiva e un'interazione negli ultimi 60 secondi. L'ascolto audio in background non aumenta questo tempo e resta misurato separatamente. L'ultimo segnale non è un orario certo di uscita. Aggiornamenti ogni 15 secondi e alla chiusura quando possibile; rete e sospensione del browser possono causare sottostime. La correlazione del dispositivo mantiene i limiti della stima mensile già descritti.

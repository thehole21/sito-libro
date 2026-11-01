# Sito del libro — pronto per Vercel

Il PDF originale è incluso in `public/libro.pdf`. La copertina originale è in `public/copertina.pdf`. Il sito è in italiano, responsive e include un lettore PDF con pagine e zoom, download, spazio audiolibro, commenti persistenti e statistiche riservate.

## Pubblicazione

1. Carica questa cartella in un repository GitHub (non caricare `node_modules`, `dist` o `.env`). Importalo come nuovo progetto su Vercel. Il preset è **Vite**, build `npm run build`, output `dist`; Node 22 o successivo.
2. Crea un database **Neon Postgres**, anche tramite le integrazioni di Vercel, e collega il progetto. Nel SQL Editor del database esegui tutto `schema.sql` una sola volta.
3. In Vercel → Settings → Environment Variables imposta per Production:
   - `DATABASE_URL`: la stringa di connessione Neon, solo lato server.
   - `ADMIN_PASSWORD`: una password casuale di almeno 16 caratteri.
   - `ANALYTICS_SECRET`: una stringa segreta casuale di almeno 32 caratteri, diversa dalla password.
4. Esegui un nuovo deploy dopo aver aggiunto le variabili. Visita il sito, invia un commento di prova e apri `/api/admin` per verificare le statistiche.

Nessun account o servizio esterno è stato creato automaticamente. Senza database e variabili PDF e lettore funzionano, ma commenti e statistiche non possono funzionare. Non inserire mai i segreti in `public`, in variabili `VITE_*` o nel repository.

## Statistiche: solo per te

Apri `https://TUO-SITO.vercel.app/api/admin`. Nome utente: **admin**. Password: il valore di `ADMIN_PASSWORD`. Non esistono link a questa pagina nel sito pubblico. La protezione è sul server e i dati non vengono inviati ai visitatori. Usa HTTPS; il browser memorizza l'accesso Basic fino alla chiusura della sessione: per consultarlo su computer condivisi usa una finestra privata e chiudila al termine.

Mostra visite e visitatori stimati del mese, suddivisione telefono/tablet/computer e dettaglio giornaliero. Gli identificatori derivano da un HMAC di IP e user agent, cambiano ogni mese, non sono cookie e non identificano persone o hardware. IP e user agent originali non vengono salvati nel database applicativo; l'hosting può avere propri log. Le statistiche non sono esposte pubblicamente, ma la presenza della richiesta tecnica di conteggio è osservabile negli strumenti del browser: nessun sito può garantire che sia impossibile scoprirla. Se serve un'informativa privacy per la tua pubblicazione, adattala ai servizi e alle finalità effettivi.

## Audiolibro

Quando disponibile, aggiungi `audiolibro.mp3` in `public` e cambia `public/config.json` in `{"audioUrl":"/audiolibro.mp3"}`, quindi ripubblica. Per file grandi usa un URL HTTPS pubblico su uno storage adatto all'audio. Il player apparirà automaticamente al posto di “In arrivo”.

## Commenti

Pubblici, con nome e testo, senza registrazione. Il testo viene mostrato come testo semplice (HTML non eseguibile). Nessun `maxlength` nel campo commento; rimane un limite tecnico di sicurezza di **1 MB per invio**, con messaggio per dividere testi più grandi. Nessun sistema può accettare una lunghezza letteralmente infinita. Un invio ogni 30 secondi per IP/browser e un campo antispam invisibile riducono lo spam; non sostituiscono un servizio antibot per siti ad alto traffico. Gli altri commenti si caricano con il pulsante dedicato. Per moderare, usa il SQL Editor di Neon: `SELECT id,name,created_at FROM comments ORDER BY id DESC;` e `DELETE FROM comments WHERE id = ...;`.

## Sviluppo e verifiche

`npm ci`, `npm run build`, `npm test`. `npm run dev` avvia la parte grafica locale; le API di Vercel richiedono `npx vercel dev` con le variabili del file `.env.example` copiate in `.env.local` e valorizzate. I test locali verificano protezione amministratore, escaping e classificazione; un test completo del database richiede il database configurato. Il lettore PDF usa PDF.js incluso nel bundle, senza CDN.

Documentazione: https://vercel.com/docs/functions/limitations e https://neon.com/docs/serverless/serverless-driver

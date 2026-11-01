# Audiolibro

File: `public/audiolibro.m4a`. Durata verificata: **1:49:15.973**. Formato AAC mono, 48 kHz, circa 64 kbit/s; metadati MP4 all'inizio del file per avviare la riproduzione prima del download completo. Dimensione: 54.34 MB.

I 12 file originali sono stati concatenati senza rimuovere parti, nell'ordine seguente:

1. Cap 1 2.m4a
2. Cap 3 4.m4a
3. Cap 5 6.m4a
4. Cap 7.m4a
5. Fine cap 7.m4a
6. Cap 8.m4a
7. Fine cap8 , cap 9.m4a
8. Cap 10 e 11.m4a
9. Cap 12 e 13.m4a
10. Cap 14 e 15.m4a
11. Cap 16.m4a
12. Cap17.m4a

La somma delle durate originali è 6555.9723 secondi. Il file finale è stato decodificato interamente senza errori. I file originali non sono stati modificati.

La configurazione pubblica dell'audio è in `public/config.json`; identificativo e durata usati dalle statistiche sono in `lib/audio-book.js`. Se in futuro sostituisci il libro, aggiorna anche questi due valori.

## Misurazione

Il player trasmette gli intervalli `audio.played`, con aggiornamenti ogni 15 secondi e su pausa/fine/uscita quando possibile. Il server unisce gli intervalli sovrapposti: un salto alla fine non vale come ascolto completo e riascoltare una porzione non aumenta la copertura. La soglia di completamento è 98% in una singola sessione della pagina. Gli ascolti fuori dal player non sono misurati. Il traffico manomesso da un client non può essere escluso con certezza.

Statistiche mensili riservate in `/api/admin`: dispositivi stimati, sessioni, dispositivi con almeno un ascolto completo e con soli ascolti parziali. I dettagli mostrano gli ultimi 100 dispositivi stimati, identificativo pseudonimo, categoria, browser, sistema operativo, percentuale massima di una sessione e ultimo aggiornamento. Non sono nomi hardware o personali. Lo stesso dispositivo può apparire diverso cambiando rete/browser; persone diverse con la stessa rete/browser possono essere aggregate. La chiave cambia ogni mese, quindi una sessione aperta al cambio mese richiede il ricaricamento della pagina per riprendere la registrazione.

La tabella `audio_sessions` è creata automaticamente. Se il ruolo database non può creare tabelle, esegui `schema.sql` aggiornato nel SQL Editor di Neon. L'ascolto rimane disponibile anche quando la telemetria non funziona.

## Telefono e tablet

Il player usa i controlli audio nativi, AAC-LC in M4A e avvio manuale. La distribuzione statica supporta richieste Range (risposta 206 verificata in anteprima), utili per avanzamento e ripresa. Il PDF usa il bundle legacy di PDF.js, controlli touch di almeno 44 px, inserimento pagina con tastierino numerico e un limite di 4 milioni di pixel per il canvas per contenere la memoria durante lo zoom. Restano disponibili i collegamenti al PDF originale.

Verificati: decodifica completa audio, durata e ordine, rendering PDF, richieste Range, query Postgres e test di riservatezza. Non verificato su dispositivi Android/iPhone fisici; il controllo visivo del browser locale non è stato disponibile in questa sessione.

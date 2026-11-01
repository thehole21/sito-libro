import {escapeHtml as e} from './server.js';

export async function ensureVisitSchema(sql) {
  await sql`CREATE TABLE IF NOT EXISTS visit_sessions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id uuid NOT NULL UNIQUE,
    visitor text NOT NULL,
    device text NOT NULL,
    browser text NOT NULL,
    os text NOT NULL,
    entered_at timestamptz NOT NULL DEFAULT now(),
    last_activity_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    active_seconds integer NOT NULL DEFAULT 0
  )`;
}

export function validSessionEvent(body) {
  return body && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.session||'') &&
    Number.isInteger(body.activeSeconds)&&body.activeSeconds>=0&&body.activeSeconds<=31536000 &&
    Number.isInteger(body.lastActivityAgo)&&body.lastActivityAgo>=0&&body.lastActivityAgo<=31536000;
}

export async function saveVisitSession(sql,record) {
  const {session,visitor,device,browser,os,activeSeconds,lastActivityAgo}=record;
  await sql`INSERT INTO visit_sessions (session_id,visitor,device,browser,os,active_seconds)
    VALUES (${session}::uuid,${visitor},${device},${browser},${os},LEAST(${activeSeconds}::integer,15))
    ON CONFLICT (session_id) DO UPDATE SET
      active_seconds=GREATEST(visit_sessions.active_seconds,
        LEAST(${activeSeconds}::integer,GREATEST(0,FLOOR(EXTRACT(EPOCH FROM (now()-visit_sessions.entered_at))))::integer+15)),
      last_activity_at=GREATEST(visit_sessions.last_activity_at,now()-${lastActivityAgo}::integer*interval '1 second'),
      last_seen_at=now()
    WHERE visit_sessions.visitor=EXCLUDED.visitor`;
}

function duration(seconds) {
  const n=Math.max(0,Math.round(Number(seconds)||0));
  return `${Math.floor(n/3600)}h ${Math.floor(n%3600/60)}m ${n%60}s`;
}
function date(value){return new Date(value).toLocaleString('it-IT',{timeZone:'Europe/Rome',hour12:false});}

export async function visitDashboard(sql,cursor) {
  if(cursor!==undefined&&(!/^\d{1,19}$/.test(String(cursor))||BigInt(cursor)>9223372036854775807n))return '<h2 id="sessioni">Sessioni di visita</h2><p>Pagina non valida.</p>';
  const before=String(cursor||'9223372036854775807');
  try {
    await ensureVisitSchema(sql);
    const [totals,rows]=await Promise.all([
      sql`SELECT count(*)::int AS total,coalesce(avg(active_seconds),0) AS average,
        coalesce(sum(active_seconds),0) AS active FROM visit_sessions
        WHERE entered_at>=date_trunc('month',CURRENT_DATE)`,
      sql`SELECT id::text,visitor,device,browser,os,entered_at,last_activity_at,last_seen_at,active_seconds
        FROM visit_sessions WHERE entered_at>=date_trunc('month',CURRENT_DATE) AND id<${before}::bigint
        ORDER BY id DESC LIMIT 101`
    ]);
    const total=totals[0];
    return `<h2 id="sessioni">Sessioni di visita · mese corrente</h2>
      <p>Orari in Italia (Europe/Rome). Dettagli disponibili soltanto dalle visite successive all’attivazione di questa funzione; le visualizzazioni precedenti restano nel contatore generale.</p>
      <section><div><strong>${e(total.total)}</strong>Sessioni registrate</div><div><strong>${e(duration(total.active))}</strong>Tempo attivo totale stimato</div><div><strong>${e(duration(total.average))}</strong>Tempo attivo medio stimato</div></section>
      <div style="overflow-x:auto"><table><tr><th>Dispositivo anonimo</th><th>Browser / sistema</th><th>Ingresso</th><th>Ultima attività</th><th>Ultimo segnale</th><th>Tempo attivo stimato</th></tr>
      ${rows.slice(0,100).map(row=>`<tr><td>${e(row.device)}<br><small>${e(row.visitor.slice(0,12))}</small></td><td>${e(row.browser)} / ${e(row.os)}</td><td>${e(date(row.entered_at))}</td><td>${e(date(row.last_activity_at))}</td><td>${e(date(row.last_seen_at))}</td><td>${e(duration(row.active_seconds))}</td></tr>`).join('')||'<tr><td colspan="6">Nessuna nuova sessione registrata.</td></tr>'}</table></div>
      <p>${before!=='9223372036854775807'?'<a href="/api/admin#sessioni">Visite più recenti</a> · ':''}${rows.length>100?`<a href="/api/admin?visitsBefore=${e(rows[99].id)}#sessioni">Visite precedenti →</a>`:''}</p>
      <p>Una sessione corrisponde a un’apertura della pagina; ricaricarla ne avvia una nuova. Il tempo attivo viene stimato quando la pagina è visibile, ha il focus e ci sono state interazioni negli ultimi 60 secondi. La lettura senza movimenti per oltre un minuto non viene conteggiata. “Ultima attività” è l’ultima interazione rilevata; “ultimo segnale” è l’ultimo aggiornamento ricevuto, non l’ora certa di uscita. Aggiornamenti circa ogni 15 secondi: chiusure forzate, rete assente e browser sospesi possono perdere gli ultimi secondi. L’audio in background ha le proprie statistiche separate. Ricarica questa pagina per aggiornare i dati.</p>`;
  } catch {
    return '<h2 id="sessioni">Sessioni di visita</h2><p>Dati non disponibili. Verifica il database e il permesso di creare visit_sessions, oppure esegui schema.sql aggiornato in Neon.</p>';
  }
}

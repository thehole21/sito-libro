import { escapeHtml as e } from './server.js';

export async function ensureAudioSchema(sql) {
  await sql`CREATE TABLE IF NOT EXISTS audio_sessions (
    session_id uuid PRIMARY KEY,
    book text NOT NULL,
    visitor text NOT NULL,
    device text NOT NULL,
    browser text NOT NULL,
    os text NOT NULL,
    duration double precision NOT NULL,
    listened double precision NOT NULL DEFAULT 0,
    completed boolean NOT NULL DEFAULT false,
    started_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
}

export function deviceDetails(ua = '') {
  const os = /android/i.test(ua) ? 'Android' : /iphone|ipad|ipod/i.test(ua) ? 'iOS / iPadOS' : /windows/i.test(ua) ? 'Windows' : /macintosh|mac os/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Altro';
  const browser = /edg\//i.test(ua) ? 'Edge' : /opr\//i.test(ua) ? 'Opera' : /samsungbrowser/i.test(ua) ? 'Samsung Internet' : /firefox|fxios/i.test(ua) ? 'Firefox' : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : 'Altro';
  return { os, browser };
}

// Union of actually played intervals: seeking and replaying never inflate coverage.
export function playedSeconds(ranges, duration) {
  if (!Array.isArray(ranges) || ranges.length > 1500) throw Error('Intervalli non validi.');
  const sorted = ranges.map(range => {
    if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isFinite) || range[0] < 0 || range[1] < range[0] || range[1] > duration + 2) throw Error('Intervalli non validi.');
    return [Math.min(range[0], duration), Math.min(range[1], duration)];
  }).sort((a,b) => a[0]-b[0]);
  let seconds = 0, end = 0;
  for (const [start, stop] of sorted) { seconds += Math.max(0, stop - Math.max(start,end)); end = Math.max(end,stop); }
  return Math.min(seconds, duration);
}

export async function saveAudioSession(sql, record) {
  const {session,book,visitor,device,browser,os,duration,listened}=record;
  await sql`INSERT INTO audio_sessions (session_id,book,visitor,device,browser,os,duration,listened,completed)
    VALUES (${session}::uuid,${book},${visitor},${device},${browser},${os},${duration},${listened},${listened >= duration * .98})
    ON CONFLICT (session_id) DO UPDATE SET
      listened=GREATEST(audio_sessions.listened,EXCLUDED.listened),
      completed=audio_sessions.completed OR EXCLUDED.completed,
      updated_at=now()
    WHERE audio_sessions.visitor=EXCLUDED.visitor AND audio_sessions.book=EXCLUDED.book`;
}

export async function audioDashboard(sql) {
  try {
    await ensureAudioSchema(sql);
    const [totals, listeners] = await Promise.all([
      sql`SELECT count(*)::int AS sessions,count(DISTINCT visitor)::int AS devices,
        count(DISTINCT visitor) FILTER (WHERE completed)::int AS complete_devices
        FROM audio_sessions WHERE started_at >= date_trunc('month',CURRENT_DATE)`,
      sql`SELECT visitor,device,browser,os,count(*)::int AS sessions,
        max(listened/duration*100) AS percentage,bool_or(completed) AS completed,
        max(updated_at) AS latest
        FROM audio_sessions WHERE started_at >= date_trunc('month',CURRENT_DATE)
        GROUP BY visitor,device,browser,os ORDER BY max(updated_at) DESC LIMIT 100`
    ]);
    const total=totals[0];
    return `<h2>Audiolibro · mese corrente</h2><section><div><strong>${e(total.devices)}</strong>Dispositivi stimati</div><div><strong>${e(total.sessions)}</strong>Sessioni di ascolto</div><div><strong>${e(total.complete_devices)}</strong>Dispositivi con ascolto completo</div><div><strong>${e(total.devices-total.complete_devices)}</strong>Dispositivi con solo ascolti parziali</div></section>
      <div style="overflow-x:auto"><table><tr><th>Dispositivo anonimo</th><th>Browser / sistema</th><th>Sessioni</th><th>Ascolto massimo</th><th>Stato</th><th>Ultimo aggiornamento</th></tr>
      ${listeners.map(row=>`<tr><td>${e(row.device)}<br><small>${e(row.visitor.slice(0,12))}</small></td><td>${e(row.browser)} / ${e(row.os)}</td><td>${e(row.sessions)}</td><td>${Math.min(100,Number(row.percentage)).toFixed(1)}%</td><td>${row.completed?'Completo (≥98%)':'Parziale'}</td><td>${e(new Date(row.latest).toLocaleString('it-IT',{timeZone:'Europe/Rome'}))}</td></tr>`).join('') || '<tr><td colspan="6">Nessun ascolto registrato.</td></tr>'}</table></div>
      <p>Ultimi 100 dispositivi stimati del mese; i contatori comprendono tutti gli ascoltatori del mese. “Completo” indica almeno il 98% delle parti riprodotte in una singola sessione. Saltare alla fine o riascoltare lo stesso pezzo non aumenta la copertura. Ogni apertura della pagina con avvio dell’audio è una sessione; le percentuali di sessioni diverse non si sommano. Aggiornamento ogni 15 secondi, in pausa e alla chiusura quando il browser lo consente. Sono misure della riproduzione, non una prova che la persona abbia ascoltato. Nomi personali e identificativi hardware non sono accessibili; IP condivisi, VPN e browser diversi possono alterare il conteggio.</p>`;
  } catch {
    return '<h2>Audiolibro</h2><p>Statistiche audio non disponibili. Verifica il database e i permessi di creazione della tabella audio_sessions, oppure esegui schema.sql nel SQL Editor di Neon.</p>';
  }
}

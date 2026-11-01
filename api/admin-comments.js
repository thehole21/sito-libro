import { database, authorized, privateHeaders, escapeHtml as e } from '../lib/server.js';

export default async function handler(req, res) {
  privateHeaders(res);
  if (!authorized(req)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Area riservata", charset="UTF-8"');
    return res.status(401).send('Accesso riservato.');
  }
  if (req.method !== 'GET') return res.status(405).end();
  const before = String(req.query?.before || '9223372036854775807');
  if (!/^\d{1,19}$/.test(before) || BigInt(before) > 9223372036854775807n) return res.status(400).send('Pagina non valida.');
  try {
    const sql = database();
    const rows = await sql`SELECT id::text,name,comment,created_at FROM comments WHERE id < ${before}::bigint ORDER BY id DESC LIMIT 3`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Commenti riservati</title><style>body{font:16px/1.6 system-ui;max-width:850px;margin:40px auto;padding:20px;background:#f6f4ef}h1{font-family:Georgia}article{padding:24px 0;border-top:1px solid #ccc}article p{white-space:pre-wrap;overflow-wrap:anywhere}time{display:block;color:#666;font-size:13px}a{color:inherit}nav{display:flex;gap:24px}</style><a href="/api/admin">← Statistiche</a><h1>I messaggi dei lettori.</h1><p>Area riservata. Nomi e commenti sono visibili solo a te.</p>${rows.slice(0,2).map(c => `<article><strong>${e(c.name)}</strong><time>${e(new Date(c.created_at).toLocaleString('it-IT', {timeZone:'Europe/Rome'}))}</time><p>${e(c.comment)}</p></article>`).join('') || '<p>Nessun commento ricevuto.</p>'}<nav>${before !== '9223372036854775807' ? '<a href="/api/admin-comments">Torna ai più recenti</a>' : ''}${rows.length > 2 ? `<a href="/api/admin-comments?before=${e(rows[1].id)}">Commenti precedenti →</a>` : ''}</nav></html>`);
  } catch {
    return res.status(503).send('Commenti non disponibili. Verifica il collegamento al database.');
  }
}

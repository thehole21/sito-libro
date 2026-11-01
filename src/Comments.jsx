import React, { useCallback, useEffect, useRef, useState } from 'react';

export default function Comments() {
  const [comments, setComments] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const requestId = useRef(0);
  const load = useCallback(async (before = null) => {
    const id = ++requestId.current;
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/comments' + (before ? `?before=${encodeURIComponent(before)}` : ''));
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (id !== requestId.current) return;
      setComments(previous => before ? [...previous, ...data.comments] : data.comments);
      setCursor(data.next);
    } catch {
      if (id === requestId.current) setError('I commenti non sono momentaneamente disponibili. Riprova tra poco.');
    } finally { if (id === requestId.current) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => { requestId.current++; }; }, [load]);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setSending(true); setStatus('Pubblicazione…');
    try {
      const response = await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invio non riuscito. Riprova.');
      form.reset(); setStatus('Grazie! Il tuo commento è stato pubblicato.');
      await load();
    } catch (error) { setStatus(error.message || 'Invio non riuscito. Riprova.'); }
    finally { setSending(false); }
  }
  return <section id="commenti">
    <p className="eyebrow">03 / DOPO L’ULTIMA PAGINA</p><h2>Lascia un pensiero.</h2><p>Una frase o una riflessione più lunga. Questo spazio è tuo.</p>
    <form onSubmit={submit}>
      <label htmlFor="name">Nome</label><input id="name" name="name" autoComplete="name" maxLength={100} required placeholder="Come ti chiami?" />
      <label htmlFor="comment">Commento</label><textarea id="comment" name="comment" rows={6} required placeholder="Che cosa ti è rimasto di questo libro?" />
      <div className="trap" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" aria-label="Lascia vuoto" /></div>
      <p className="small">Il nome e il commento saranno pubblici.</p><button className="button" type="submit" disabled={sending}>{sending ? 'Pubblicazione…' : 'Pubblica il commento ↗'}</button><p role="status">{status}</p>
    </form>
    <div aria-live="polite">{comments.map(comment => <article className="comment" key={comment.id}><strong>{comment.name}</strong><time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleDateString('it-IT')}</time><p>{comment.comment}</p></article>)}
      {loading && <p>Caricamento commenti…</p>}{error && <p role="status">{error}</p>}
      {!loading && !error && !comments.length && <p>Nessun commento, per ora. Il primo può essere il tuo.</p>}
    </div>
    {(cursor || error) && <button id="more" disabled={loading} onClick={() => load(cursor)}>{error ? 'Riprova' : 'Altri commenti ↓'}</button>}
  </section>;
}

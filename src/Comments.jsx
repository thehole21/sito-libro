import React, { useState } from 'react';

export default function Comments() {
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setSending(true); setStatus('Invio in corso…');
    try {
      const response = await fetch('/api/comments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invio non riuscito. Riprova.');
      form.reset();
      setStatus('Grazie! Il tuo commento è stato inviato privatamente all’autore. Gli altri utenti non potranno leggerlo.');
    } catch (error) { setStatus(error.message || 'Invio non riuscito. Riprova.'); }
    finally { setSending(false); }
  }

  return <section id="commenti">
    <p className="eyebrow">03 / UN PENSIERO PER L’AUTORE</p>
    <h2>Lascia un pensiero.</h2>
    <p>Una frase o una riflessione più lunga, da condividere direttamente con l’autore.</p>
    <p id="comment-privacy"><strong>Il tuo commento è privato.</strong> Il nome e il messaggio saranno visibili solo all’autore, mai agli altri utenti del sito.</p>
    <form onSubmit={submit} aria-describedby="comment-privacy">
      <label htmlFor="name">Nome</label><input id="name" name="name" autoComplete="name" maxLength={100} required placeholder="Come ti chiami?" />
      <label htmlFor="comment">Commento</label><textarea id="comment" name="comment" rows={6} required placeholder="Che cosa ti è rimasto di questo libro?" />
      <div className="trap" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" aria-label="Lascia vuoto" /></div>
      <button className="button" type="submit" disabled={sending}>{sending ? 'Invio in corso…' : 'Invia all’autore ↗'}</button>
      <p role="status">{status}</p>
    </form>
  </section>;
}

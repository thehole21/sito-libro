import React, { useEffect, useState } from 'react';
import PdfReader from './PdfReader.jsx';
import Comments from './Comments.jsx';
import AudioPlayer from './AudioPlayer.jsx';
import VisitTracker from './VisitTracker.jsx';
let visitRecorded = false;

export default function App() {
  const [audioUrl, setAudioUrl] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    fetch('/config.json', { signal: abort.signal }).then(r => r.json()).then(config => setAudioUrl(config.audioUrl || '')).catch(() => {});
    if (!visitRecorded) { visitRecorded = true; fetch('/api/visit', { method: 'POST', keepalive: true }).catch(() => {}); }
    return () => abort.abort();
  }, []);
  return <>
    <VisitTracker />
    <header><a href="#" className="brand">MANÌ IACOPO JOZDANI</a><nav aria-label="Menu"><a href="#lettura">Leggi</a><a href="#audio">Ascolta</a><a href="#commenti">Commenti</a></nav></header>
    <main><section className="hero"><div><p className="eyebrow">UN LIBRO. A TUA DISPOSIZIONE.</p><h1>La vita<br />non ti deve<br />un cazzo<span>.</span></h1><p className="intro">Prenditi il tuo tempo.<br />Leggilo qui, oppure portalo con te.</p><div className="actions"><a className="button" href="#lettura">Inizia a leggere <span>↗</span></a><a className="download" href="/libro.pdf" download>Scarica il PDF ↓</a></div></div><div className="book" role="img" aria-label="Copertina del libro La vita non ti deve un cazzo" /></section>
      <PdfReader />
      <section id="audio" className="audio-section"><div><p className="eyebrow">02 / L’AUDIOLIBRO</p><h2>Le stesse parole.<br />Una voce.</h2></div><div id="audio-player">{audioUrl ? <AudioPlayer src={audioUrl} /> : <><span className="badge">IN ARRIVO</span><p>L’audiolibro sarà disponibile qui.<br />Nel frattempo, buona lettura.</p></>}</div></section>
      <Comments />
    </main><footer><span>MANÌ IACOPO JOZDANI</span><span>Buona lettura.</span></footer>
  </>;
}

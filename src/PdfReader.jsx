import React, { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = worker;

export default function PdfReader() {
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [status, setStatus] = useState('Caricamento del libro…');
  const paperRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let active = true;
    const task = getDocument('/libro.pdf');
    task.promise.then(document => { if (active) setPdf(document); }).catch(() => {
      if (active) setStatus('Il lettore non è disponibile. Puoi aprire o scaricare il PDF.');
    });
    return () => { active = false; void task.destroy(); };
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(paperRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf || !width) return;
    let active = true;
    let task;
    // Each render owns its buffer: rapid navigation cannot reuse an active canvas.
    const buffer = document.createElement('canvas');
    async function render() {
      try {
        setStatus('Caricamento della pagina…');
        const pdfPage = await pdf.getPage(page);
        if (!active) return;
        const base = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(Math.max(width - 12, 100) / base.width, 1.45) * zoom;
        const viewport = pdfPage.getViewport({ scale });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        buffer.width = Math.ceil(viewport.width * ratio);
        buffer.height = Math.ceil(viewport.height * ratio);
        task = pdfPage.render({ canvasContext: buffer.getContext('2d'), viewport, transform: [ratio, 0, 0, ratio, 0, 0] });
        await task.promise;
        if (!active) return;
        const canvas = canvasRef.current;
        canvas.width = buffer.width;
        canvas.height = buffer.height;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.getContext('2d').drawImage(buffer, 0, 0);
        setStatus('');
      } catch (error) {
        if (active && error.name !== 'RenderingCancelledException') setStatus('Impossibile visualizzare questa pagina. Puoi aprire il PDF originale.');
      }
    }
    void render();
    return () => { active = false; task?.cancel(); };
  }, [pdf, page, zoom, width]);

  return <section id="lettura">
    <div className="section-title"><div><p className="eyebrow">01 / IL LIBRO</p><h2>Una pagina alla volta.</h2></div><a className="download" href="/libro.pdf" target="_blank" rel="noopener">Apri PDF ↗</a></div>
    <div className="reader"><div className="toolbar">
      <button disabled={!pdf || page === 1} onClick={() => setPage(p => p - 1)} aria-label="Pagina precedente">←</button>
      <label>Pagina <input type="number" min="1" max={pdf?.numPages || 1} value={page} disabled={!pdf} aria-label="Numero di pagina" onChange={event => setPage(Math.max(1, Math.min(pdf.numPages, Number.parseInt(event.target.value, 10) || 1)))} /> <span>/ {pdf?.numPages || '…'}</span></label>
      <button disabled={!pdf || page === pdf.numPages} onClick={() => setPage(p => p + 1)} aria-label="Pagina successiva">→</button>
      <span className="spacer" />
      <button disabled={zoom <= .75} onClick={() => setZoom(z => z - .25)} aria-label="Riduci zoom">−</button>
      <button disabled={zoom >= 3} onClick={() => setZoom(z => z + .25)} aria-label="Aumenta zoom">+</button>
    </div>{status && <p id="reader-status" role="status">{status}</p>}
    <div id="paper" ref={paperRef}><canvas ref={canvasRef} aria-label={`Pagina ${page} del libro`} /></div>
    <p className="reader-note">Usa le frecce per sfogliare. Per selezionare il testo o usare un lettore vocale, <a href="/libro.pdf">apri il PDF originale</a>.</p></div>
  </section>;
}

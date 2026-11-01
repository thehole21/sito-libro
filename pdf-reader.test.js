import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { loadBook } from './src/load-book.js';

test('book loads through its URL and renders consecutive pages with PDF.js', async () => {
  const bytes = await readFile(new URL('./public/libro.pdf', import.meta.url));
  const server = createServer((req, res) => {
    if (req.url !== '/libro.pdf') { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Length': bytes.length });
    res.end(bytes);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const task = loadBook(getDocument, `http://127.0.0.1:${server.address().port}/libro.pdf`);
  try {
    const pdf = await task.promise;
    assert.ok(pdf.numPages > 1);
    for (const number of [1, 2]) {
      const page = await pdf.getPage(number);
      const viewport = page.getViewport({ scale: .5 });
      const target = pdf.canvasFactory.create(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({ canvasContext: target.context, viewport }).promise;
      const pixels = target.context.getImageData(0, 0, target.canvas.width, target.canvas.height).data;
      assert.ok(pixels.some((value, index) => index % 4 !== 3 && value < 200), `Page ${number} must contain visible content`);
      pdf.canvasFactory.destroy(target);
    }
  } finally {
    await task.destroy();
    await new Promise(resolve => server.close(resolve));
  }
});

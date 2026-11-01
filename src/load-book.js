// PDF.js 6 requires a parameter object; passing a bare URL no longer works.
export function loadBook(getDocument, url = '/libro.pdf') {
  return getDocument({ url });
}

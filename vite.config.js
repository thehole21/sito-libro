import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: { target: ['es2020','safari15'], rollupOptions: { output: { manualChunks: { pdf: ['pdfjs-dist/legacy/build/pdf.mjs'] } } } }
});

import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Una cartella per lingua: ogni file .html al suo interno diventa una pagina del sito.
const langs = ['de', 'it', 'en-us', 'fr'];
const input: Record<string, string> = { root: resolve(__dirname, 'index.html') };
for (const lang of langs) {
  for (const file of readdirSync(resolve(__dirname, lang)).filter((f) => f.endsWith('.html'))) {
    input[`${lang}-${file.replace('.html', '')}`] = resolve(__dirname, lang, file);
  }
}

export default defineConfig({ base: './', build: { rollupOptions: { input } } });

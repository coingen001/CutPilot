import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        root: resolve(__dirname, 'index.html'),
        de: resolve(__dirname, 'de/index.html'),
        it: resolve(__dirname, 'it/index.html'),
      },
    },
  },
});

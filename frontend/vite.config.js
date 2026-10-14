import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le frontend tourne sur http://localhost:5173 (origine autorisée par le CORS du backend).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});

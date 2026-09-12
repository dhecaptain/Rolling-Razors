import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            vendor: ['motion', 'lucide-react', 'canvas-confetti'],
          },
        },
      },
    },
    server: {
      // Hosted previews proxy HTTP requests but do not keep a Vite WebSocket open.
      // Disable HMR there to prevent the client from repeatedly logging failed sockets;
      // local development keeps HMR unless explicitly disabled.
      hmr: process.env.DISABLE_HMR !== 'true' && !process.env.VERCEL,
      watch: process.env.DISABLE_HMR === 'true' || Boolean(process.env.VERCEL) ? null : {},
    },
  };
});

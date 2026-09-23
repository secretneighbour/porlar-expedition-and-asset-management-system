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
    server: {
      allowedHosts: true as const,
      // Hot Module Replacement (HMR) configuration
      hmr: process.env.DISABLE_HMR !== 'true',
      // Reverse proxy for seamless multi-PC and standalone Vite dev server execution
      proxy: {
        '/api': {
          target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
          ws: true,
          changeOrigin: true,
        },
      },
      // File watching configuration to ignore runtime state persistence files
      watch: {
        ignored: [
          '**/polar-state.json',
          '**/polar-database.json',
          '**/data/**',
          '**/.git/**',
          '**/node_modules/**',
          '**/dist/**',
        ],
      },
    },
  };
});

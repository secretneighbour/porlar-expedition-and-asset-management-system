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
          target: process.env.VITE_BACKEND_URL || process.env.VITE_API_BASE_URL || 'https://porlar-expedition-and-asset-management-system-4cmpww9cj.vercel.app',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: process.env.VITE_BACKEND_URL || process.env.VITE_API_BASE_URL || 'https://porlar-expedition-and-asset-management-system-4cmpww9cj.vercel.app',
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

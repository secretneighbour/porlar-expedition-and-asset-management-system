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
      // File watching configuration to ignore runtime state persistence files
      watch: {
        ignored: [
          '**/polar-state.json',
          '**/.git/**',
          '**/node_modules/**',
          '**/dist/**',
        ],
      },
    },
  };
});

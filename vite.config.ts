import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const configuredApiBase = (env.VITE_API_BASE_URL || env.VITE_BACKEND_URL || env.VITE_API_URL || '').trim();
  const backendTarget = configuredApiBase || 'http://localhost:3000';

  return {
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(configuredApiBase),
      'import.meta.env.VITE_API_URL': JSON.stringify((env.VITE_API_URL || configuredApiBase).trim()),
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify((env.VITE_BACKEND_URL || configuredApiBase).trim()),
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'spa-fallback-generator',
        closeBundle() {
          const distDir = path.resolve(__dirname, 'dist');
          const indexPath = path.join(distDir, 'index.html');
          const fallbackPath = path.join(distDir, '200.html');
          if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, fallbackPath);
          }
          // Ensure no recursive _redirects file is emitted
          const redirectsPath = path.join(distDir, '_redirects');
          if (fs.existsSync(redirectsPath)) {
            fs.unlinkSync(redirectsPath);
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: true as const,
      // Hot Module Replacement (HMR) configuration
      hmr: env.DISABLE_HMR !== 'true',
      // Reverse proxy for seamless multi-PC and standalone Vite dev server execution
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: backendTarget,
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

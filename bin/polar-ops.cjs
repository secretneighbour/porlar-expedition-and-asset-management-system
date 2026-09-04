#!/usr/bin/env node

/**
 * Polar Expedition and Asset Management System - Standalone CLI Runner
 * Runs the tactical operations workstation with real-time WebSocket sync.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distServer = path.join(rootDir, 'dist', 'server.cjs');
const distIndex = path.join(rootDir, 'dist', 'index.html');

// Check if production build exists, otherwise run build automatically
if (!fs.existsSync(distServer) || !fs.existsSync(distIndex)) {
  console.log('[POLAR-OPS] Production build artifacts not found. Building project with Vite and esbuild...');
  try {
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
    console.log('[POLAR-OPS] Build completed successfully.');
  } catch (err) {
    console.error('[POLAR-OPS] Failed to compile build artifacts:', err.message);
    process.exit(1);
  }
}

// Launch the full-stack WebSocket + Express server
try {
  require(distServer);
} catch (err) {
  console.error('[POLAR-OPS] Failed to launch server:', err.message);
  process.exit(1);
}

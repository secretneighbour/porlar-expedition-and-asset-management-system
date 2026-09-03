#!/usr/bin/env node

/**
 * Polar Expedition and Asset Management System - Standalone CLI Runner
 * Runs the tactical operations workstation locally or in a containerized environment.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Check if production build exists, otherwise run build automatically
if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
  console.log('[POLAR-OPS] Distribution assets not found. Compiling production bundle...');
  try {
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
    console.log('[POLAR-OPS] Build completed successfully.');
  } catch (err) {
    console.error('[POLAR-OPS] Failed to compile build artifacts:', err.message);
    process.exit(1);
  }
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.woff2': 'font/woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') {
    reqPath = '/index.html';
  }

  let filePath = path.join(distDir, reqPath);

  // Security: prevent path traversal outside distDir
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Single Page Application (SPA) fallback to index.html
      filePath = path.join(distDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
        });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log('================================================================');
  console.log('  POLAR EXPEDITION & ASSET MANAGEMENT SYSTEM');
  console.log('  INTERNATIONAL POLAR LOGISTICS & TELEMETRY CONSOLE');
  console.log('================================================================');
  console.log(`  Access URL: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`  Environment: Production Static Server`);
  console.log(`  Status: Standby / Operational`);
  console.log('================================================================');
});

process.on('SIGTERM', () => {
  console.log('[POLAR-OPS] SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('\n[POLAR-OPS] Shutting down console...');
  server.close(() => process.exit(0));
});

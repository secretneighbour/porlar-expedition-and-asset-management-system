#!/usr/bin/env node

/**
 * Polaris Ops - Tauri v2 Android Build & Dev Runner
 *
 * Automatically prepares the Android SDK / NDK environment,
 * sets necessary CLI variables, and invokes Tauri v2 Android commands.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { prepareEnvironment } = require('./prepare-android-env.cjs');

const projectRoot = path.resolve(__dirname, '..');

// Prepare SDK, NDK, and local.properties
const { env } = prepareEnvironment({ verbose: false });

const rawArgs = process.argv.slice(2);
const command = rawArgs[0] || 'build';
const passedArgs = rawArgs.slice(1);

// Centralized Cloudflare Worker backend URL for mobile/Android production
const PRODUCTION_BACKEND_URL = 'https://porlar-expedition-and-asset-management-system.ggm23768.workers.dev';

// Ensure Android build routes backend API requests to Cloudflare Worker by default,
// while preserving explicit ngrok or dev overrides if specified by developer.
const isDebugBuild = passedArgs.includes('--debug') || passedArgs.includes('-d');
if (!env.VITE_API_BASE_URL || (!isDebugBuild && (env.VITE_API_BASE_URL.includes('localhost') || env.VITE_API_BASE_URL.includes('127.0.0.1')))) {
  env.VITE_API_BASE_URL = env.VITE_API_URL && !env.VITE_API_URL.includes('localhost')
    ? env.VITE_API_URL
    : PRODUCTION_BACKEND_URL;
}
env.VITE_API_URL = env.VITE_API_BASE_URL;
env.VITE_BACKEND_URL = env.VITE_API_BASE_URL;

// Locate tauri CLI binary (node_modules/.bin/tauri)
const tauriBin = process.platform === 'win32'
  ? path.join(projectRoot, 'node_modules', '.bin', 'tauri.cmd')
  : path.join(projectRoot, 'node_modules', '.bin', 'tauri');

const tauriExecutable = fs.existsSync(tauriBin) ? tauriBin : 'tauri';

let tauriArgs = ['android', command];

if (command === 'build') {
  // If neither --apk nor --aab was provided, default to --apk for convenience
  const hasFormat = passedArgs.some(arg => arg === '--apk' || arg === '--aab');
  if (!hasFormat) {
    tauriArgs.push('--apk');
  }
}

tauriArgs.push(...passedArgs);

console.log(`[POLAR-OPS-ANDROID] Executing: ${tauriExecutable} ${tauriArgs.join(' ')}`);

const child = spawn(tauriExecutable, tauriArgs, {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('error', (err) => {
  console.error('[POLAR-OPS-ANDROID] Failed to start Tauri CLI process:', err.message);
  process.exit(1);
});

child.on('close', (code) => {
  if (code === 0 && command === 'build') {
    const isDebug = passedArgs.includes('--debug') || passedArgs.includes('-d');
    const variant = isDebug ? 'debug' : 'release';
    const outputsDir = path.join(projectRoot, 'src-tauri', 'gen', 'android', 'app', 'build', 'outputs', 'apk');

    console.log('\n================================================================================');
    console.log(`[POLAR-OPS-ANDROID] Android Build Complete (${variant.toUpperCase()})`);

    // Search for generated APKs
    if (fs.existsSync(outputsDir)) {
      function findApks(dir) {
        let results = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          const full = path.join(dir, item.name);
          if (item.isDirectory()) {
            results = results.concat(findApks(full));
          } else if (item.name.endsWith('.apk')) {
            results.push(full);
          }
        }
        return results;
      }

      const apks = findApks(outputsDir);
      if (apks.length > 0) {
        console.log('Generated APK(s):');
        for (const apk of apks) {
          console.log(`  -> ${path.relative(projectRoot, apk)}`);
        }
      }
    }
    console.log('================================================================================\n');
  }
  process.exit(code || 0);
});

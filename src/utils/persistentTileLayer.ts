/**
 * POLARIS — Persistent Offline Leaflet Tile Layer
 *
 * Custom Leaflet TileLayer that intercepts all tile requests to:
 * 1. Serve immediately from browser CacheStorage (0ms latency, persistent across reloads, 100% offline).
 * 2. Fetch over network and persist into CacheStorage when online.
 * 3. Gracefully render vector SVG fallback when uncached areas are navigated offline.
 * 4. Tag each tile with data-offline-cached ('hit' | 'saved' | 'fallback') for telemetry and visual indicators.
 */

import L from 'leaflet';
import { offlineMapCache } from './offlineMapCache.js';

export interface PersistentTileLayerOptions extends L.TileLayerOptions {
  errorTileUrl?: string;
  onTileHit?: (url: string) => void;
  onTileMiss?: (url: string) => void;
  onTileFallback?: (url: string) => void;
}

export class PersistentOfflineTileLayer extends L.TileLayer {
  private persistentOptions: PersistentTileLayerOptions;
  private activeObjectUrls: Set<string> = new Set();

  constructor(urlTemplate: string, options: PersistentTileLayerOptions = {}) {
    super(urlTemplate, options);
    this.persistentOptions = options;
  }

  createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const tile = document.createElement('img');

    // Standard Leaflet DOM listeners
    L.DomEvent.on(tile, 'load', L.Util.bind((this as any)._tileOnLoad, this, done, tile));
    L.DomEvent.on(tile, 'error', L.Util.bind((this as any)._tileOnError, this, done, tile));

    if (this.options.crossOrigin || this.options.crossOrigin === '') {
      tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
    }

    tile.alt = '';
    tile.setAttribute('role', 'presentation');

    const tileUrl = this.getTileUrl(coords);

    // Intercept with persistent cache
    offlineMapCache
      .fetchAndCacheTile(tileUrl)
      .then(({ blob, fromCache }) => {
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          this.activeObjectUrls.add(objectUrl);
          tile.dataset.offlineCached = fromCache ? 'hit' : 'saved';
          tile.src = objectUrl;

          if (fromCache && this.persistentOptions.onTileHit) {
            this.persistentOptions.onTileHit(tileUrl);
          } else if (!fromCache && this.persistentOptions.onTileMiss) {
            this.persistentOptions.onTileMiss(tileUrl);
          }
        } else {
          // Uncached and offline, or network failure
          tile.dataset.offlineCached = 'fallback';
          tile.src = this.persistentOptions.errorTileUrl || (this.options as any).errorTileUrl || '';
          if (this.persistentOptions.onTileFallback) {
            this.persistentOptions.onTileFallback(tileUrl);
          }
        }
      })
      .catch(() => {
        tile.dataset.offlineCached = 'fallback';
        tile.src = this.persistentOptions.errorTileUrl || (this.options as any).errorTileUrl || '';
        if (this.persistentOptions.onTileFallback) {
          this.persistentOptions.onTileFallback(tileUrl);
        }
      });

    return tile;
  }

  onRemove(map: L.Map): this {
    // Revoke any active Object URLs to prevent memory leaks
    this.activeObjectUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    this.activeObjectUrls.clear();
    return super.onRemove(map);
  }
}

export function createPersistentTileLayer(
  urlTemplate: string,
  options: PersistentTileLayerOptions = {}
): PersistentOfflineTileLayer {
  return new PersistentOfflineTileLayer(urlTemplate, options);
}

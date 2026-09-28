/**
 * Polaris Platform Abstraction Layer
 * Seamlessly bridges Web, Tauri Desktop (Linux/Windows/macOS), and Tauri Mobile (Android/iOS).
 */

export type PlatformType = 'web' | 'tauri-desktop' | 'tauri-mobile';

export interface PlatformMetadata {
  type: PlatformType;
  isTauri: boolean;
  isDesktop: boolean;
  isMobile: boolean;
  os: string;
  arch: string;
  version?: string;
}

/**
 * Detects if currently executing inside a Tauri runtime environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

/**
 * Detects if the device is a mobile handset/tablet (via User Agent or Tauri native OS)
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /android|iphone|ipad|ipod|mobile|touch|opera mini|iemobile/i.test(ua);
}

export function isDesktop(): boolean {
  return !isMobile();
}

export function isWeb(): boolean {
  return !isTauri();
}

export function getPlatformType(): PlatformType {
  if (!isTauri()) return 'web';
  return isMobile() ? 'tauri-mobile' : 'tauri-desktop';
}

/**
 * Retrieves comprehensive platform diagnostics from native Rust or browser environment
 */
export async function getPlatformMetadata(): Promise<PlatformMetadata> {
  const tauriActive = isTauri();
  const mobile = isMobile();
  const baseType: PlatformType = !tauriActive ? 'web' : mobile ? 'tauri-mobile' : 'tauri-desktop';

  if (tauriActive) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const nativeInfo: any = await invoke('get_native_platform_info');
      return {
        type: nativeInfo.is_mobile ? 'tauri-mobile' : 'tauri-desktop',
        isTauri: true,
        isDesktop: nativeInfo.is_desktop,
        isMobile: nativeInfo.is_mobile,
        os: nativeInfo.os || 'unknown',
        arch: nativeInfo.arch || 'unknown',
        version: nativeInfo.tauri_version,
      };
    } catch {
      // Fallback if invoke fails before Tauri core is ready
    }
  }

  return {
    type: baseType,
    isTauri: false,
    isDesktop: !mobile,
    isMobile: mobile,
    os: typeof navigator !== 'undefined' ? navigator.platform || 'browser' : 'server',
    arch: 'x86_64/arm',
  };
}

/**
 * Native cross-platform notification dispatch
 * Uses Tauri Notification plugin when available, falling back to Web Notification API
 */
export async function sendPlatformNotification(title: string, body?: string): Promise<boolean> {
  if (isTauri()) {
    try {
      const { sendNotification, isPermissionGranted, requestPermission } = await import(
        '@tauri-apps/plugin-notification'
      );
      let granted = await isPermissionGranted();
      if (!granted) {
        const permission = await requestPermission();
        granted = permission === 'granted';
      }
      if (granted) {
        sendNotification({ title, body });
        return true;
      }
    } catch (err) {
      console.warn('[Platform] Tauri notification failed:', err);
    }
  }

  // Fallback to browser Notification API
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
      return true;
    } else if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification(title, { body });
        return true;
      }
    }
  }

  return false;
}

/**
 * Persistent snapshot storage (Tauri filesystem / localStorage fallback)
 */
export async function saveLocalData(key: string, data: any): Promise<boolean> {
  const jsonStr = JSON.stringify(data);

  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('save_offline_snapshot', { key, data: jsonStr });
    } catch {
      // ignore and continue to localStorage
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`polar_${key}`, jsonStr);
      return true;
    } catch (e) {
      console.warn('[Platform] localStorage quota exceeded or unavailable:', e);
    }
  }

  return false;
}

/**
 * Retrieves snapshot data from Tauri native cache or localStorage fallback
 */
export async function loadLocalData<T = any>(key: string): Promise<T | null> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const nativeContent = (await invoke('load_offline_snapshot', { key })) as string | null;
      if (nativeContent) {
        return JSON.parse(nativeContent) as T;
      }
    } catch {
      // fallback to localStorage
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`polar_${key}`);
      if (raw) {
        return JSON.parse(raw) as T;
      }
    } catch {
      return null;
    }
  }

  return null;
}

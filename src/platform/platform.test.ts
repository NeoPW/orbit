import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectPlatform } from './platform.ts';

describe('detectPlatform', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports desktop when running inside the desktop app', () => {
    // The Tauri webview sets a global `isTauri` flag.
    vi.stubGlobal('isTauri', true);
    expect(detectPlatform()).toBe('desktop');
  });

  it('reports android when running inside the Android app', () => {
    vi.stubGlobal('isTauri', true);
    expect(detectPlatform('Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36')).toBe('android');
  });

  it('reports desktop for the Linux desktop app and browser for an Android browser tab', () => {
    vi.stubGlobal('isTauri', true);
    expect(detectPlatform('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15')).toBe('desktop');
    vi.unstubAllGlobals();
    expect(detectPlatform('Mozilla/5.0 (Linux; Android 15) Chrome/131.0 Mobile Safari/537.36')).toBe('browser');
  });

  it('reports browser when running in a browser tab', () => {
    expect(detectPlatform()).toBe('browser');
  });
});

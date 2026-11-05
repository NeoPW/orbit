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

  it('reports browser when running in a browser tab', () => {
    expect(detectPlatform()).toBe('browser');
  });
});

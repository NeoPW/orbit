import { describe, expect, it } from 'vitest';
import { suggestedAddress } from './address.ts';

const hosted = { origin: 'https://orbit.example.workers.dev', hostname: 'orbit.example.workers.dev' };
const dev = { origin: 'http://localhost:1420', hostname: 'localhost' };

describe('suggestedAddress', () => {
  it('suggests the hosted page address in the browser', () => {
    expect(suggestedAddress('browser', hosted)).toBe('https://orbit.example.workers.dev');
  });

  it('suggests nothing on a development address or on the desktop', () => {
    expect(suggestedAddress('browser', dev)).toBe('');
    expect(suggestedAddress('desktop', hosted)).toBe('');
  });
});

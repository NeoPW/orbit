import { describe, expect, it } from 'vitest';
import { isPhoneWidth, PHONE_QUERY } from './useIsPhone.ts';

describe('phone layout width', () => {
  it('uses the phone layout below 640 px', () => {
    expect(isPhoneWidth(390)).toBe(true);
    expect(isPhoneWidth(639)).toBe(true);
    expect(isPhoneWidth(640)).toBe(false);
    expect(isPhoneWidth(1280)).toBe(false);
  });

  it('matches the media query', () => {
    expect(PHONE_QUERY).toBe('(max-width: 639px)');
  });
});

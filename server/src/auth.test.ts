import { describe, expect, it } from 'vitest';
import { isAuthorized } from './auth.ts';

const TOKENS = 'desktop=aaa111,browser=bbb222';

describe('device tokens', () => {
  it('rejects a missing token', async () => {
    expect(await isAuthorized(null, TOKENS)).toBe(false);
  });

  it('rejects an unknown token', async () => {
    expect(await isAuthorized('Bearer nope', TOKENS)).toBe(false);
  });

  it('rejects a header that is not a bearer token', async () => {
    expect(await isAuthorized('aaa111', TOKENS)).toBe(false);
  });

  it('accepts each device with its own token', async () => {
    expect(await isAuthorized('Bearer aaa111', TOKENS)).toBe(true);
    expect(await isAuthorized('Bearer bbb222', TOKENS)).toBe(true);
  });

  it('rejects a removed device and keeps the others', async () => {
    expect(await isAuthorized('Bearer bbb222', 'desktop=aaa111')).toBe(false);
    expect(await isAuthorized('Bearer aaa111', 'desktop=aaa111')).toBe(true);
  });

  it('rejects everything when no tokens are configured', async () => {
    expect(await isAuthorized('Bearer ', undefined)).toBe(false);
    expect(await isAuthorized('Bearer x', '')).toBe(false);
  });
});

/** Parses the `DEVICE_TOKENS` secret: comma-separated `name=token` pairs. The names only make the list readable. */
export function parseDeviceTokens(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((pair) => pair.trim())
    .filter((pair) => pair !== '')
    .map((pair) => pair.slice(pair.indexOf('=') + 1))
    .filter((token) => token !== '');
}

async function sha256(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

/** Compares two equally long digests without stopping at the first difference. */
function equal(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** True when the `Authorization` header carries one of the configured device tokens. */
export async function isAuthorized(header: string | null, rawTokens: string | undefined): Promise<boolean> {
  const presented = /^Bearer (.+)$/.exec(header ?? '')?.[1];
  if (presented === undefined) return false;
  const presentedDigest = await sha256(presented);
  let ok = false;
  for (const token of parseDeviceTokens(rawTokens)) {
    if (equal(presentedDigest, await sha256(token))) ok = true;
  }
  return ok;
}

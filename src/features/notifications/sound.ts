/** A short two-tone chime for the end of a focus session. Silent when audio is unavailable or blocked. */
export function playChime(): void {
  try {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    const ctx = new Context();
    void ctx.resume().catch(() => {});
    const start = ctx.currentTime + 0.02;
    [
      { frequency: 659.25, offset: 0 },
      { frequency: 987.77, offset: 0.22 },
    ].forEach(({ frequency, offset }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      const t = start + offset;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.95);
    });
    setTimeout(() => void ctx.close().catch(() => {}), 1800);
  } catch {
    // An AudioContext may need a user gesture; the notification is enough then.
  }
}

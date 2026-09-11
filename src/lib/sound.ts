let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    if (!audioContext) audioContext = new Ctor();
    if (audioContext.state === "suspended") {
      audioContext.resume().catch((err) => console.warn("Couldn't resume audio context:", err));
    }
    return audioContext;
  } catch (err) {
    console.warn("Web Audio isn't available:", err);
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType,
  peakGain: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);

  const startTime = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

/** Short click for each name change during the shuffle — ticks slow down as the draw settles, like a wheel. */
export function playDrawTick() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 900, 0, 0.08, "square", 0.25);
}

/** Little ascending chime played once the winner is revealed. */
export function playDrawFanfare() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => playTone(ctx, freq, i * 0.12, 0.4, "triangle", 0.22));
}

/** Standalone test tone, unrelated to the draw — for confirming sound works at all on this device. */
export function playTestTone() {
  const ctx = getAudioContext();
  if (!ctx) {
    console.warn("Web Audio API isn't available in this browser.");
    return;
  }
  playTone(ctx, 660, 0, 0.3, "sine", 0.3);
}

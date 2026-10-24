/**
 * Pure, seeded random-number utilities. No global state.
 *
 * splitmix32 gives a fast, well-distributed uniform stream from a 32-bit seed.
 * Determinism (same seed -> same stream on any machine) is required by the
 * uncertainty-propagation design (Requirement 5.2).
 */

export interface Rng {
  /** Next uniform in [0, 1). */
  next(): number;
}

/** splitmix32: integer seed -> uniform [0,1) stream. */
export function splitmix32(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next(): number {
      a = (a + 0x9e3779b9) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 16), 0x21f0aaad);
      t = Math.imul(t ^ (t >>> 15), 0x735a2d97);
      t = (t ^ (t >>> 15)) >>> 0;
      return t / 4294967296;
    },
  };
}

/**
 * Standard-normal sample via Box–Muller, scaled to mean/sd.
 * Draws two uniforms per call; guards u1 away from 0 to avoid log(0).
 */
export function normal(rng: Rng, mean: number, sd: number): number {
  let u1 = rng.next();
  const u2 = rng.next();
  if (u1 < 1e-12) u1 = 1e-12;
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + sd * z;
}

/**
 * Convert a 95% CI [low, high] of a normal distribution to its standard
 * deviation. 95% CI half-width = 1.959964 * sd.
 */
export function sdFrom95CI(low: number, high: number): number {
  return (high - low) / (2 * 1.959963984540054);
}

/** Linear-interpolated percentile (0..1) of a numeric sample. */
export function percentile(sortedAsc: number[], p: number): number {
  const n = sortedAsc.length;
  if (n === 0) return Number.NaN;
  if (n === 1) return sortedAsc[0] as number;
  const idx = p * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const frac = idx - lo;
  const a = sortedAsc[lo] as number;
  const b = sortedAsc[hi] as number;
  return a + (b - a) * frac;
}

export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

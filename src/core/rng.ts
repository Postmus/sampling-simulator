export interface RNG {
  next: () => number;
}

export function createRng(seed: number): RNG {
  let state = seed >>> 0;

  return {
    next: () => {
      state += 0x6d2b79f5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}

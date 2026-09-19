export const EASE = {
  standard: [0.2, 0, 0, 1],
  decel: [0.05, 0.7, 0.1, 1],
  accel: [0.3, 0, 0.8, 0.15],
  expressive: [0.16, 1, 0.3, 1],
} as const;

export const DUR = { micro: 0.12, short: 0.20, medium: 0.32, long: 0.48, hero: 0.90 } as const;
export const STAGGER = 0.06;

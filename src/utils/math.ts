export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function bound(value: number, min: number, max: number): number {
  return Math.max(Math.min(value, max), min);
}

export interface ICache<V> {
  get(key: string): V | null;
  set(key: string, value: V): void;
  delete(key: string): void;
}

export class InMemoryCache<V> implements ICache<V> {
  private readonly cache = new Map<string, V>();

  constructor() {}

  delete(key: string): void {
    this.cache.delete(key);
  }

  get(key: string): V | null {
    return this.cache.get(key) ?? null;
  }

  set(key: string, value: V): void {
    this.cache.set(key, value);
  }
}

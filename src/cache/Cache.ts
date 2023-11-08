export interface ICache<V> {
  get(key: string): Promise<V | null>;
  set(key: string, value: V): Promise<void>;
  delete(key: string): Promise<void>;
}

export class InMemoryCache<V> implements ICache<V> {
  private readonly cache = new Map<string, V>();

  constructor() {}

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async get(key: string): Promise<V | null> {
    return this.cache.get(key) ?? null;
  }

  async set(key: string, value: V): Promise<void> {
    this.cache.set(key, value);
  }
}

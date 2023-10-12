import { promises as fs } from 'fs';
import { ImageID, ImageMeta } from '../types';
import { randomUUID } from 'crypto';

export interface ImageMetaStorage {
  list(): Promise<ImageMeta[]>;

  get(name: ImageID): Promise<ImageMeta | null>;
  create(name: ImageID): Promise<ImageMeta>;
  delete(name: ImageID): Promise<boolean>;
}

export class FSImageMetaStorage implements ImageMetaStorage {
  private readonly cache: Map<string, ImageMeta> = new Map();
  private isCacheHydrated = false;

  constructor(private readonly jsonConfigFilePath: string) {}

  list(): Promise<ImageMeta[]> {
    return this.getData().then((data) => [...data.values()]);
  }

  async get(name: string): Promise<ImageMeta | null> {
    const data = await this.getData();
    return data.get(name) ?? null;
  }

  async create(name: string): Promise<ImageMeta> {
    const newMeta = {
      id: randomUUID(),
      name,
    };

    const data = await this.getData();
    data.set(newMeta.name, newMeta);
    await this.applyChanges();

    return newMeta;
  }

  async delete(id: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async getData() {
    if (!this.isCacheHydrated) {
      try {
        const rawData = await fs.readFile(this.jsonConfigFilePath, { encoding: 'utf-8' });
        const data: ImageMeta[] = JSON.parse(rawData);

        this.cache.clear();
        data.forEach((meta) => this.cache.set(meta.name, meta));
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }

      this.isCacheHydrated = true;
    }

    return this.cache!;
  }

  async applyChanges() {
    const data = await this.getData();
    const rawData = JSON.stringify(Array.from(data.values()), null, 2);

    await fs.writeFile(this.jsonConfigFilePath, rawData);
  }
}

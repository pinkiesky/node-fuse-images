import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import { ImageMeta } from '../types';
import { removeExtension } from '../../utils/filenames';
import { filenameToMimeType } from '../../utils/mimeType';
import { IImageMetaStorage } from './IImageMetaStorage';

export class FSImageMetaStorage implements IImageMetaStorage {
  private readonly cache: Map<string, ImageMeta> = new Map();
  private isCacheHydrated = false;

  constructor(private readonly jsonConfigFilePath: string) {}

  async applyChanges() {
    const data = await this.getData();
    const rawData = JSON.stringify(Array.from(data.values()), null, 2);

    await fs.writeFile(this.jsonConfigFilePath, rawData);
  }

  async create(name: string): Promise<ImageMeta> {
    const data = await this.getData();
    if (data.has(name)) {
      throw new Error(`Image ${name} already exists`);
    }

    const mimeType = filenameToMimeType(name);
    if (!mimeType) {
      throw new Error(`Unknown image type for ${name}`);
    }

    const newMeta = {
      id: randomUUID(),
      name: removeExtension(name),
      originalFileName: name,
      originalFileType: mimeType,
    };

    data.set(newMeta.name, newMeta);
    await this.applyChanges();

    return newMeta;
  }

  async get(name: string): Promise<ImageMeta | null> {
    const data = await this.getData();
    return data.get(name) ?? null;
  }

  async getData() {
    if (!this.isCacheHydrated) {
      try {
        const rawData = await fs.readFile(this.jsonConfigFilePath, {
          encoding: 'utf-8',
        });
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

  list(): Promise<ImageMeta[]> {
    return this.getData().then((data) => [...data.values()]);
  }

  async remove(name: string): Promise<boolean> {
    const data = await this.getData();
    const deleted = data.delete(name);

    if (deleted) {
      await this.applyChanges();
    }

    return deleted;
  }
}

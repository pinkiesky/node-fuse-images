import { join } from 'path';
import { promises as fs } from 'fs';
import { ImageMeta, Image } from './types';

export interface ImageBinaryStorage {
  load(image: ImageMeta): Promise<Image>;
  write(image: Image): Promise<void>;
  remove(image: ImageMeta): Promise<void>;
}

export class FSImageBinaryStorage implements ImageBinaryStorage {
  constructor(private readonly mountPath: string) {}

  getPath(image: ImageMeta): string {
    return join(this.mountPath, image.id);
  }

  async load(image: ImageMeta): Promise<Image> {
    const binary = await fs.readFile(this.getPath(image));

    return {
      meta: image,
      binary: {
        buffer: binary,
        size: binary.byteLength,
      },
    };
  }

  write(image: Image): Promise<void> {
    return fs.writeFile(this.getPath(image.meta), image.binary.buffer);
  }

  remove(image: ImageMeta): Promise<void> {
    return fs.unlink(this.getPath(image));
  }
}

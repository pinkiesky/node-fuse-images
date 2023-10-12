import { promises as fs } from 'fs';
import { join } from 'path';

interface BinaryLoader {
  load(image: ImageMeta): Promise<ImageMetaWithBinary>;
  write(image: ImageMetaWithBinary): Promise<void>;
}

export class FSBinaryLoader implements BinaryLoader {
  constructor(private readonly mountPath: string) {}

  async load(image: ImageMeta): Promise<ImageMetaWithBinary> {
    const binary = await fs.readFile(join(this.mountPath, image.id));

    return {
      ...image,
      binary,
    };
  }

  write(image: ImageMetaWithBinary): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

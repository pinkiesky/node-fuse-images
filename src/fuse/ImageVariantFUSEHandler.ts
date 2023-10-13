import { Stats } from 'node-fuse-bindings';
import { FUSEError } from './FUSEError';
import { FileFUSETreeNode } from './FUSETreeNode';
import { ImageBinaryStorage } from '../images/ImageBinaryStorage';
import { IImageVariant } from '../images/variants/types';
import { ImageMeta } from '../images/types';

export class ImageVariantFUSEHandler extends FileFUSETreeNode {
  constructor(
    private readonly imagePostfix: string,
    private readonly imageMeta: ImageMeta,
    private readonly imageBinaryStorage: ImageBinaryStorage,
    private readonly imageVariant: IImageVariant,
  ) {
    super();
  }

  get name(): string {
    return `${this.imageMeta.name}${this.imagePostfix}`;
  }

  async getattr(): Promise<Stats> {
    let size = 0;
    try {
      size = (await this.readAll()).length;
    } catch {}

    // @ts-expect-error
    return {
      mtime: new Date(),
      atime: new Date(),
      ctime: new Date(),
      nlink: 1,
      size,
      mode: 33188,
      uid: process.getuid ? process.getuid() : 0,
      gid: process.getgid ? process.getgid() : 0,
    };
  }

  async open(flags: number): Promise<void> {}

  async readAll(): Promise<Buffer> {
    const image = await this.imageBinaryStorage.load(this.imageMeta);

    return (await this.imageVariant.generate(image)).buffer;
  }

  writeAll(b: Buffer): Promise<void> {
    throw FUSEError.accessDenied();
  }

  remove(): Promise<void> {
    throw FUSEError.accessDenied();
  }
}

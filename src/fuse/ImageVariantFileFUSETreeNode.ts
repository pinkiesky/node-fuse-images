import { Stats } from 'node-fuse-bindings';
import { FUSEError } from './FUSEError';
import { FileFUSETreeNode } from './IFUSETreeNode';
import { ImageMeta } from '../images/types';
import { ImageLoaderFacade } from '../images/ImageLoaderFacade';
import { IImageVariant } from '../images/variants/IImageVariant';

export class ImageVariantFileFUSETreeNode extends FileFUSETreeNode {
  private bufferedImage: Promise<Buffer> | null = null;

  get name(): string {
    return `${this.imageMeta.name}${this.imagePostfix}`;
  }

  constructor(
    private readonly imagePostfix: string,
    private readonly imageMeta: ImageMeta,
    private readonly imageBinaryResolver: ImageLoaderFacade,
    private readonly imageVariant: IImageVariant,
  ) {
    super();
  }

  private getVariantBuffer(cleanBuffer: boolean): Promise<Buffer> {
    if (this.bufferedImage) {
      const buffer = this.bufferedImage;

      if (cleanBuffer) {
        this.bufferedImage = null;
      }

      return buffer;
    }

    const newBuffer = this.imageBinaryResolver
      .load(this.imageMeta)
      .then((image) => {
        if (!image) {
          throw FUSEError.notFound('resolver not found for ' + this.name);
        }

        return this.imageVariant.generate(image);
      })
      .then((imageBinary) => imageBinary.buffer);

    if (!cleanBuffer) {
      this.bufferedImage = newBuffer;
    }

    return newBuffer;
  }

  async getattr(): Promise<Stats> {
    let size = 0;
    try {
      size = (await this.getVariantBuffer(false)).length;
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

  async checkAvailability(flags: number): Promise<void> {}

  async readAll(): Promise<Buffer> {
    return this.getVariantBuffer(true);
  }

  remove(): Promise<void> {
    throw FUSEError.accessDenied();
  }

  writeAll(b: Buffer): Promise<void> {
    throw FUSEError.accessDenied();
  }
}

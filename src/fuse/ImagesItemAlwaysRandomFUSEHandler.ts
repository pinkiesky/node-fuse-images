import { Stats } from 'node-fuse-bindings';
import { FUSEError } from './FUSEError';
import { DirectoryFUSETreeNode, FUSETreeNode } from './FUSETreeNode';
import { BinaryStorage } from '../images/BinaryStorage';
import { ImageMeta } from '../images/types';
import { ImageVariantFUSEHandler } from './ImageVariantFUSEHandler';
import { ImageOriginalVariant } from '../images/variants/ImageOriginalVariant';
import { IImageVariant, ImageFormat } from '../images/variants/types';
import { ICache } from '../cache/Cache';
import { ObjectTreeNode } from '../objectTree';
import { ImageCacheVariant } from '../images/variants/ImageCacheVariant';
import { ImageAlwaysRandomVariant } from '../images/variants/ImageAlwaysRandomVariant';
import { ImageBinaryResolver } from '../images/ImageBinaryResolver';

export class ImagesItemAlwaysRandomFUSEHandler extends DirectoryFUSETreeNode {
  private _children: FUSETreeNode[];
  name = 'always_random';
  constructor(
    private readonly imageMeta: ImageMeta,
    private readonly imageBinaryResolver: ImageBinaryResolver,
  ) {
    super();

    const build = (format: ImageFormat) =>
      new ImageVariantFUSEHandler(
        `.${format}`,
        this.imageMeta,
        this.imageBinaryResolver,
        new ImageAlwaysRandomVariant(format),
      );

    this._children = [build('webp'), build('jpeg'), build('png')];
  }

  children(): Promise<ObjectTreeNode[]> {
    return Promise.resolve(this._children);
  }

  async create(name: string, mode: number): Promise<void> {
    throw FUSEError.accessDenied();
  }

  async getattr(): Promise<Stats> {
    // @ts-expect-error
    return {
      mtime: new Date(),
      atime: new Date(),
      ctime: new Date(),
      nlink: 1,
      size: 100,
      mode: 16877,
      uid: process.getuid ? process.getuid() : 0,
      gid: process.getgid ? process.getgid() : 0,
    };
  }

  remove(): Promise<void> {
    throw FUSEError.accessDenied();
  }
}

import { Stats } from 'node-fuse-bindings';
import { FUSEError } from './FUSEError';
import { DirectoryFUSETreeNode, FUSETreeNode } from './FUSETreeNode';
import { ImageBinaryStorage } from '../images/ImageBinaryStorage';
import { ImageMeta } from '../images/types';
import { ImageVariantFUSEHandler } from './ImageVariantFUSEHandler';
import { ImageOriginalVariant } from '../images/variants/ImageOriginalVariant';
import { IImageVariant, ImageFormat } from '../images/variants/types';
import { ICache } from '../cache/Cache';
import { ObjectTreeNode } from '../objectTree';
import { ImageCacheVariant } from '../images/variants/ImageCacheVariant';
import { ImageAlwaysRandomVariant } from '../images/variants/ImageAlwaysRandomVariant';
import { ImageWithTextVariant } from '../images/variants/ImageWithTextVariant';

export class ImagesItemCounterFUSEHandler extends DirectoryFUSETreeNode {
  private _children: FUSETreeNode[];

  constructor(
    private readonly outputFormat: ImageFormat,
    private readonly upperLimit: number,
    private readonly imageMeta: ImageMeta,
    private readonly imageBinaryStorage: ImageBinaryStorage,
    cache: ICache<ReturnType<IImageVariant['generate']>>,
  ) {
    super();

    const build = (text: string) =>
      new ImageVariantFUSEHandler(
        `_${text}.${outputFormat}`,
        this.imageMeta,
        this.imageBinaryStorage,
        new ImageCacheVariant(
          ['counter', text, outputFormat],
          cache,
          new ImageWithTextVariant(outputFormat, text),
        ),
      );

    this._children = new Array(upperLimit).fill(0).map((_, i) => build(`${i}`));
  }

  get name(): string {
    return `counter to ${this.upperLimit} (${this.outputFormat})`;
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

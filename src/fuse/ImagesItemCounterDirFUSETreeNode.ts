import { Stats } from 'node-fuse-bindings';
import { FUSEError } from './FUSEError';
import { DirectoryFUSETreeNode, IFUSETreeNode } from './IFUSETreeNode';
import { ImageMeta } from '../images/types';
import { ImageVariantFileFUSETreeNode } from './ImageVariantFileFUSETreeNode';
import { ImageFormat } from '../images/variants/types';
import { ICache } from '../cache/Cache';
import { ImageCacheWrapper } from '../images/variants/ImageCacheWrapper';
import { ImageWithTextVariant } from '../images/variants/ImageWithTextVariant';
import { ImageLoaderFacade } from '../images/ImageLoaderFacade';
import { IImageVariant } from '../images/variants/IImageVariant';

export class ImagesItemCounterDirFUSETreeNode extends DirectoryFUSETreeNode {
  private _children: IFUSETreeNode[];

  get name(): string {
    return `counter to ${this.upperLimit}`;
  }

  constructor(
    private readonly upperLimit: number,
    private readonly imageMeta: ImageMeta,
    private readonly imageBinaryStorage: ImageLoaderFacade,
    cache: ICache<ReturnType<IImageVariant['generate']>>,
  ) {
    super();
    const formats = ['jpg', 'png', 'webp'] as ImageFormat[];

    const build = (text: string, format: ImageFormat) =>
      new ImageVariantFileFUSETreeNode(
        `_${text}.${format}`,
        this.imageMeta,
        this.imageBinaryStorage,
        new ImageCacheWrapper(
          ['counter', text, format],
          cache,
          new ImageWithTextVariant(format, text),
        ),
      );

    this._children = [];
    for (let i = 0; i < this.upperLimit; i++) {
      for (const format of formats) {
        this._children.push(build(i.toString(), format));
      }
    }
  }

  children(): Promise<IFUSETreeNode[]> {
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

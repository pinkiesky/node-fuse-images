import { Stats } from 'node-fuse-bindings';
import { FUSEError } from './FUSEError';
import { DirectoryFUSETreeNode, IFUSETreeNode } from './IFUSETreeNode';
import { ImageMeta } from '../images/types';
import { ImageVariantFileFUSETreeNode } from './ImageVariantFileFUSETreeNode';
import { ImageFormat } from '../images/variants/types';
import { ImageAlwaysRandomVariant } from '../images/variants/ImageAlwaysRandomVariant';
import { ImageLoaderFacade } from '../images/ImageLoaderFacade';

export class ImagesItemAlwaysRandomDirFUSETreeNode extends DirectoryFUSETreeNode {
  private _children: IFUSETreeNode[];
  name = 'always_random';
  constructor(
    private readonly imageMeta: ImageMeta,
    private readonly imageBinaryResolver: ImageLoaderFacade,
  ) {
    super();

    const build = (format: ImageFormat) =>
      new ImageVariantFileFUSETreeNode(
        `.${format}`,
        this.imageMeta,
        this.imageBinaryResolver,
        new ImageAlwaysRandomVariant(format),
      );

    this._children = [build('webp'), build('jpeg'), build('png')];
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

import { Stats } from 'node-fuse-bindings';
import { FUSEError } from './FUSEError';
import { DirectoryFUSETreeNode, IFUSETreeNode } from './IFUSETreeNode';
import { ImageMeta } from '../images/types';
import { ImagesItemOriginalDirFUSETreeNode } from './ImagesItemOriginalDirFUSETreeNode';
import { ICache } from '../cache/Cache';
import { ImagesItemAlwaysRandomDirFUSETreeNode } from './ImagesItemAlwaysRandomDirFUSETreeNode';
import { ImagesItemCounterDirFUSETreeNode } from './ImagesItemCounterDirFUSETreeNode';
import { ImageLoaderFacade } from '../images/ImageLoaderFacade';
import { IImageVariant } from '../images/variants/IImageVariant';
import { IImageMetaStorage } from '../images/imageMeta/IImageMetaStorage';

export class ImagesItemDirFUSETreeNode extends DirectoryFUSETreeNode {
  private readonly _children: IFUSETreeNode[];

  get name(): string {
    return this.imageMeta.name;
  }

  constructor(
    private readonly imageMetaStorage: IImageMetaStorage,
    private readonly imageBinaryResolver: ImageLoaderFacade,
    private readonly imageMeta: ImageMeta,
    private cache: ICache<ReturnType<IImageVariant['generate']>>,
  ) {
    super();

    this._children = [
      new ImagesItemOriginalDirFUSETreeNode(
        this.imageMeta,
        this.imageBinaryResolver,
        this.cache,
      ),
      new ImagesItemAlwaysRandomDirFUSETreeNode(
        this.imageMeta,
        this.imageBinaryResolver,
      ),
      new ImagesItemCounterDirFUSETreeNode(
        'webp',
        10,
        this.imageMeta,
        this.imageBinaryResolver,
        this.cache,
      ),
      new ImagesItemCounterDirFUSETreeNode(
        'jpg',
        10,
        this.imageMeta,
        this.imageBinaryResolver,
        this.cache,
      ),
      new ImagesItemCounterDirFUSETreeNode(
        'png',
        10,
        this.imageMeta,
        this.imageBinaryResolver,
        this.cache,
      ),
    ];
  }

  children(): Promise<IFUSETreeNode[]> {
    return Promise.resolve(this._children);
  }

  async create(name: string, mode: number): Promise<void> {
    await this.imageMetaStorage.create(name);
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

import { Stats } from 'node-fuse-bindings';
import { FUSEError } from './FUSEError';
import { DirectoryFUSETreeNode, FUSETreeNode } from './FUSETreeNode';
import { ImageMetaStorage } from '../images/ImageMetaStorage';
import { ImageMeta } from '../images/types';
import { ImagesItemOriginalFUSEHandler } from './ImagesItemOriginalFUSEHandler';
import { ICache } from '../cache/Cache';
import { IImageVariant } from '../images/variants/types';
import { ImagesItemAlwaysRandomFUSEHandler } from './ImagesItemAlwaysRandomFUSEHandler';
import { ImagesItemCounterFUSEHandler } from './ImagesItemCounterFUSEHandler';
import { ImageBinaryResolver } from '../images/ImageBinaryResolver';

export class ImagesItemFUSEHandler extends DirectoryFUSETreeNode {
  private readonly _children: FUSETreeNode[];

  constructor(
    private readonly imageMetaStorage: ImageMetaStorage,
    private readonly imageBinaryResolver: ImageBinaryResolver,
    private readonly imageMeta: ImageMeta,
    private cache: ICache<ReturnType<IImageVariant['generate']>>,
  ) {
    super();

    this._children = [
      new ImagesItemOriginalFUSEHandler(
        this.imageMeta,
        this.imageBinaryResolver,
        this.cache,
      ),
      new ImagesItemAlwaysRandomFUSEHandler(
        this.imageMeta,
        this.imageBinaryResolver,
      ),
      new ImagesItemCounterFUSEHandler(
        'webp',
        10,
        this.imageMeta,
        this.imageBinaryResolver,
        this.cache,
      ),
      new ImagesItemCounterFUSEHandler(
        'jpg',
        10,
        this.imageMeta,
        this.imageBinaryResolver,
        this.cache,
      ),
      new ImagesItemCounterFUSEHandler(
        'png',
        10,
        this.imageMeta,
        this.imageBinaryResolver,
        this.cache,
      ),
    ];
  }

  get name(): string {
    return this.imageMeta.name;
  }

  children(): Promise<FUSETreeNode[]> {
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

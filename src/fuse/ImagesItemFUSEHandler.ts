import { Stats } from 'node-fuse-bindings';
import { FUSEError } from './FUSEError';
import { DirectoryFUSETreeNode, FUSETreeNode } from './FUSETreeNode';
import { ImageMetaStorage } from '../images/ImageMetaStorage';
import { ImageBinaryStorage } from '../images/ImageBinaryStorage';
import { ImageMeta } from '../images/types';
import { ImagesItemOriginalFUSEHandler } from './ImagesItemOriginalFUSEHandler';
import { ICache } from '../cache/Cache';
import { IImageVariant } from '../images/variants/types';
import { ImageAlwaysRandomVariant } from '../images/variants/ImageAlwaysRandomVariant';
import { ImagesItemAlwaysRandomFUSEHandler } from './ImagesItemAlwaysRandomFUSEHandler';
import { ImagesItemCounterFUSEHandler } from './ImagesItemCounterFUSEHandler';

export class ImagesItemFUSEHandler extends DirectoryFUSETreeNode {
  constructor(
    private readonly imageMetaStorage: ImageMetaStorage,
    private readonly imageBinaryStorage: ImageBinaryStorage,
    private readonly imageMeta: ImageMeta,
    private cache: ICache<ReturnType<IImageVariant['generate']>>,
  ) {
    super();
  }

  get name(): string {
    return this.imageMeta.name;
  }

  async children(): Promise<FUSETreeNode[]> {
    return [
      new ImagesItemOriginalFUSEHandler(
        this.imageMeta,
        this.imageBinaryStorage,
        this.cache,
      ),
      new ImagesItemAlwaysRandomFUSEHandler(
        this.imageMeta,
        this.imageBinaryStorage,
      ),
      new ImagesItemCounterFUSEHandler(
        'webp',
        10,
        this.imageMeta,
        this.imageBinaryStorage,
        this.cache,
      ),
      new ImagesItemCounterFUSEHandler(
        'jpg',
        10,
        this.imageMeta,
        this.imageBinaryStorage,
        this.cache,
      ),
      new ImagesItemCounterFUSEHandler(
        'png',
        10,
        this.imageMeta,
        this.imageBinaryStorage,
        this.cache,
      ),
    ];
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

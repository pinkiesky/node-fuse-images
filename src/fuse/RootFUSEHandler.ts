import { Stats } from 'node-fuse-bindings';
import { FUSEError } from './FUSEError';
import { IFUSETreeNode } from './IFUSETreeNode';
import { ImagesFUSEHandler } from './ImagesFUSEHandler';
import { ImageManagerFUSEHandler } from './ImageManagerFUSEHandler';
import { IImageMetaStorage } from '../images/imageMeta/IImageMetaStorage';
import { IBinaryStorage } from '../binaryStorage/IBinaryStorage';
import { ImageLoaderFacade } from '../images/ImageLoaderFacade';
import { ICache } from '../cache/Cache';
import { ImageBinary } from '../images/types';

export class RootFUSEHandler implements IFUSETreeNode {
  isLeaf = false;
  name = 'Root Node';

  private _children;

  constructor(
    metaStorage: IImageMetaStorage,
    binaryStorage: IBinaryStorage,
    imageResolver: ImageLoaderFacade,
    cache: ICache<Promise<ImageBinary>>,
  ) {
    this._children = [
      new ImageManagerFUSEHandler(metaStorage, binaryStorage),
      new ImagesFUSEHandler(metaStorage, imageResolver, cache),
    ];
  }

  async children() {
    return this._children;
  }

  create(name: string, mode: number): Promise<void> {
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

  checkAvailability(flags: number): Promise<void> {
    throw FUSEError.accessDenied();
  }

  readAll(): Promise<Buffer> {
    throw FUSEError.accessDenied();
  }

  remove(): Promise<void> {
    throw FUSEError.accessDenied();
  }

  writeAll(b: Buffer): Promise<void> {
    throw FUSEError.accessDenied();
  }
}

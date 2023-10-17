import { Stats } from 'node-fuse-bindings';
import { FUSEError } from './FUSEError';
import { DirectoryFUSETreeNode, FUSETreeNode } from './FUSETreeNode';
import { ImageMetaStorage } from '../images/ImageMetaStorage';
import { ImagesItemFUSEHandler } from './ImagesItemFUSEHandler';
import { ICache } from '../cache/Cache';
import { IImageVariant } from '../images/variants/types';
import { FUSEMode } from './utils';
import { ImageBinaryResolver } from '../images/ImageBinaryResolver';

export class ImagesFUSEHandler extends DirectoryFUSETreeNode {
  private _childer: FUSETreeNode[] = [];
  private previousChildrenIds: string[] = [];
  name = 'Images';
  constructor(
    private readonly imageMetaStorage: ImageMetaStorage,
    private readonly imageBinaryResolver: ImageBinaryResolver,
    private cache: ICache<ReturnType<IImageVariant['generate']>>,
  ) {
    super();
  }

  async children(): Promise<FUSETreeNode[]> {
    const list = await this.imageMetaStorage.list();
    const childrenIds = list.map((meta) => meta.id);

    // check diff
    const isAnyAdd = childrenIds.some(
      (id) => !this.previousChildrenIds.includes(id),
    );
    const isAnyRemove = this.previousChildrenIds.some(
      (id) => !childrenIds.includes(id),
    );
    if (!isAnyAdd && !isAnyRemove) {
      return this._childer;
    }

    this._childer = list.map(
      (meta) =>
        new ImagesItemFUSEHandler(
          this.imageMetaStorage,
          this.imageBinaryResolver,
          meta,
          this.cache,
        ),
    );

    this.previousChildrenIds = childrenIds;
    return this._childer;
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
      mode: FUSEMode.directory(
        FUSEMode.ALLOW_RX,
        FUSEMode.ALLOW_RX,
        FUSEMode.ALLOW_RX,
      ),
      uid: process.getuid ? process.getuid() : 0,
      gid: process.getgid ? process.getgid() : 0,
    };
  }

  remove(): Promise<void> {
    throw FUSEError.accessDenied();
  }
}

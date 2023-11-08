import { Stats } from 'node-fuse-bindings';
import { FUSEError } from './FUSEError';
import { DirectoryFUSETreeNode, IFUSETreeNode } from './IFUSETreeNode';
import { ImageManagerItemFUSEHandler } from './ImageManagerItemFUSEHandler';
import { FUSEMode } from './utils';
import { IImageMetaStorage } from '../images/imageMeta/IImageMetaStorage';
import { IBinaryStorage } from '../binaryStorage/IBinaryStorage';

export class ImageManagerFUSEHandler extends DirectoryFUSETreeNode {
  name = 'Image Manager';

  constructor(
    private readonly imageMetaStorage: IImageMetaStorage,
    private readonly imageBinaryStorage: IBinaryStorage,
  ) {
    super();
  }

  async children(): Promise<IFUSETreeNode[]> {
    const list = await this.imageMetaStorage.list();
    return list.map(
      (meta) =>
        new ImageManagerItemFUSEHandler(
          this.imageMetaStorage,
          this.imageBinaryStorage,
          meta,
        ),
    );
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
        FUSEMode.ALLOW_RWX,
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

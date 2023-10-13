import { Stats } from 'node-fuse-bindings';
import { FUSEError } from './FUSEError';
import { DirectoryFUSETreeNode, FUSETreeNode } from './FUSETreeNode';
import { ImageMetaStorage } from '../images/ImageMetaStorage';
import { ImageManagerItemFUSEHandler } from './ImageManagerItemFUSEHandler';
import { ImageBinaryStorage } from '../images/ImageBinaryStorage';

export class ImageManagerFUSEHandler extends DirectoryFUSETreeNode {
  name = 'Image Manager';

  constructor(
    private readonly imageMetaStorage: ImageMetaStorage,
    private readonly imageBinaryStorage: ImageBinaryStorage,
  ) {
    super();
  }

  async children(): Promise<FUSETreeNode[]> {
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
      mode: 16877,
      uid: process.getuid ? process.getuid() : 0,
      gid: process.getgid ? process.getgid() : 0,
    };
  }

  remove(): Promise<void> {
    throw FUSEError.accessDenied();
  }
}

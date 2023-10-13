import { Stats } from 'node-fuse-bindings';
import { FileFUSETreeNode } from './FUSETreeNode';
import { ImageMetaStorage } from '../images/ImageMetaStorage';
import { ImageMeta } from '../images/types';
import { ImageBinaryStorage } from '../images/ImageBinaryStorage';

export class ImageManagerItemFUSEHandler extends FileFUSETreeNode {
  constructor(
    private readonly imageMetaStorage: ImageMetaStorage,
    private readonly imageBinaryStorage: ImageBinaryStorage,
    private readonly imageMeta: ImageMeta,
  ) {
    super();
  }

  get name(): string {
    return this.imageMeta.originalFileName;
  }

  async getattr(): Promise<Stats> {
    let size = 0;
    try {
      size = (await this.readAll()).length;
    } catch {}

    // @ts-expect-error
    return {
      mtime: new Date(),
      atime: new Date(),
      ctime: new Date(),
      nlink: 1,
      size,
      mode: 33188,
      uid: process.getuid ? process.getuid() : 0,
      gid: process.getgid ? process.getgid() : 0,
    };
  }

  async open(flags: number): Promise<void> {}

  readAll(): Promise<Buffer> {
    return this.imageBinaryStorage
      .load(this.imageMeta)
      .then((image) => image.binary.buffer);
  }

  async writeAll(b: Buffer): Promise<void> {
    await this.imageBinaryStorage.write({
      meta: this.imageMeta,
      binary: {
        buffer: b,
        size: b.length,
      },
    });
  }

  async remove(): Promise<void> {
    await this.imageMetaStorage.remove(this.imageMeta.name);
  }
}

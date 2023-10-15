import { Stats } from 'node-fuse-bindings';
import { FileFUSETreeNode } from './FUSETreeNode';
import { ImageMetaStorage } from '../images/ImageMetaStorage';
import { ImageMeta } from '../images/types';
import { BinaryStorage } from '../images/BinaryStorage';

export class ImageManagerItemFUSEHandler extends FileFUSETreeNode {
  constructor(
    private readonly imageMetaStorage: ImageMetaStorage,
    private readonly imageBinaryStorage: BinaryStorage,
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

  async readAll(): Promise<Buffer> {
    const buff = await this.imageBinaryStorage.load(this.imageMeta.id);
    if (!buff) {
      throw new Error('not found');
    }

    return buff;
  }

  async writeAll(b: Buffer): Promise<void> {
    await this.imageBinaryStorage.write(this.imageMeta.id, b);
  }

  async remove(): Promise<void> {
    await this.imageMetaStorage.remove(this.imageMeta.name);
  }
}

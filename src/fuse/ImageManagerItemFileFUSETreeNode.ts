import { Stats } from 'node-fuse-bindings';
import { FileFUSETreeNode } from './IFUSETreeNode';
import { ImageMeta } from '../images/types';
import { IBinaryStorage } from '../binaryStorage/IBinaryStorage';
import { IImageMetaStorage } from '../images/imageMeta/IImageMetaStorage';

export class ImageManagerItemFileFUSETreeNode extends FileFUSETreeNode {
  get name(): string {
    return this.imageMeta.originalFileName;
  }

  constructor(
    private readonly imageMetaStorage: IImageMetaStorage,
    private readonly imageBinaryStorage: IBinaryStorage,
    private readonly imageMeta: ImageMeta,
  ) {
    super();
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

  async checkAvailability(flags: number): Promise<void> {}

  async readAll(): Promise<Buffer> {
    const buff = await this.imageBinaryStorage.load(this.imageMeta.id);
    if (!buff) {
      throw new Error('not found');
    }

    return buff;
  }

  async remove(): Promise<void> {
    await this.imageMetaStorage.remove(this.imageMeta.name);
  }

  async writeAll(b: Buffer): Promise<void> {
    await this.imageBinaryStorage.write(this.imageMeta.id, b);
  }
}

import { WriteFileDescriptor } from './fd/FileDescriptor';
import { FileDescriptorStorage } from './fd/FileDescriptorStorage';
import { FUSEError } from './fuse/FUSEError';
import { FUSETreeNode } from './fuse/FUSETreeNode';
import { FUSEPath } from './fuse/types';
import { ImageMetaStorage } from './images/ImageMetaStorage';
import { ImageMeta, Image } from './images/types';
import { IImageVariant } from './images/variants/types';
import { rootLogger } from './logger';
import { ObjectTreeNode, defaultPathResolver } from './objectTree';
import * as fuse from 'node-fuse-bindings';

// create -- only name
// write -- fd
// readdir -- path
// getattr -- path
// open -- path
// read -- fd
// release -- fd

export class FUSEHandler {
  private logger = rootLogger.getLogger(this.constructor.name);
  private fdToImageMeta: Map<number, ImageMeta> = new Map();

  constructor(
    private readonly rootNode: FUSETreeNode,
    private readonly fdStorage: FileDescriptorStorage,
  ) {
    if (rootNode.isLeaf) {
      throw new Error('Root node cannot be leaf');
    }
  }

  splitPath(path: string): string[] {
    return path.substring(1).split('/').filter(Boolean);
  }

  async getattr(path: string): Promise<fuse.Stats> {
    this.logger.info(`getattr(${path})`);

    const node = await defaultPathResolver(this.rootNode, this.splitPath(path));
    if (!node) {
      throw new FUSEError(fuse.ENOENT, 'not found');
    }

    return node.getattr();
  }

  async readdir(path: string): Promise<string[]> {
    this.logger.info(`readdir(${path})`);

    const node = await defaultPathResolver(this.rootNode, this.splitPath(path));
    if (!node) {
      throw new FUSEError(fuse.ENOENT, 'not found');
    }

    return (await node?.children()).map((child) => child.name);
  }

  async create(path: string, mode: number): Promise<number> {
    this.logger.info(`create(${path})`);

    const dirs = this.splitPath(path);
    const name = dirs.pop()!;

    const node = await defaultPathResolver(this.rootNode, dirs);
    if (!node) {
      throw new FUSEError(fuse.ENOENT, 'not found');
    }

    await node.create(name, mode);
    const fd = this.fdStorage.openWO();

    return fd.fd;
  }

  async open(path: string, flags: number): Promise<number> {
    this.logger.info(`open(${path})`);

    const node = await defaultPathResolver(this.rootNode, this.splitPath(path));
    if (!node) {
      throw new FUSEError(fuse.ENOENT, 'not found');
    }

    if (!node.isLeaf) {
      throw new FUSEError(fuse.EACCES, 'invalid path');
    }

    // check availability
    await node.open(flags);

    const fd = this.fdStorage.openRO(await node.readAll());
    return fd.fd;
  }

  async read(
    fd: number,
    buf: Buffer,
    len: number,
    pos: number,
  ): Promise<number> {
    this.logger.info(`read(${fd}, ${len}, ${pos})`);

    const fdObject = this.fdStorage.get(fd);
    if (!fdObject) {
      throw new FUSEError(fuse.EBADF, 'invalid fd');
    }

    return fdObject.readToBuffer(buf, len, pos);
  }

  async write(
    fd: number,
    buf: Buffer,
    len: number,
    pos: number,
  ): Promise<number> {
    this.logger.info(`write(${fd}, ${len}, ${pos})`);

    const fdObject = this.fdStorage.get(fd);
    if (!fdObject) {
      throw new FUSEError(fuse.EBADF, 'invalid fd');
    }

    return fdObject.writeToBuffer(buf, len, pos);
  }

  async release(path: string, fd: number): Promise<0> {
    this.logger.info(`release(${fd})`);

    const fdObject = this.fdStorage.get(fd);
    if (!fdObject) {
      throw new FUSEError(fuse.EBADF, 'invalid fd');
    }

    const node = await defaultPathResolver(this.rootNode, this.splitPath(path));
    if (!node) {
      throw new FUSEError(fuse.ENOENT, 'not found');
    }

    await node.writeAll(fdObject.binary);
    this.fdStorage.release(fd);

    return 0;
  }

  async rmdir(path: string): Promise<0> {
    this.logger.info(`rmdir(${path})`);

    const node = await defaultPathResolver(this.rootNode, this.splitPath(path));
    if (!node) {
      throw new FUSEError(fuse.ENOENT, 'not found');
    }

    if (node.isLeaf) {
      throw new FUSEError(fuse.EACCES, 'invalid path');
    }

    await node.remove();
    return 0;
  }

  async unlink(path: string): Promise<0> {
    this.logger.info(`unlink(${path})`);

    const node = await defaultPathResolver(this.rootNode, this.splitPath(path));
    if (!node) {
      throw new FUSEError(fuse.ENOENT, 'not found');
    }

    if (!node.isLeaf) {
      throw new FUSEError(fuse.EACCES, 'invalid path');
    }

    await node.remove();
    return 0;
  }
}

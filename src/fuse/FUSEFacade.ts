import { FileDescriptorStorage } from './fd/FileDescriptorStorage';
import { FUSEError } from './FUSEError';
import { FUSETreeNode } from './FUSETreeNode';
import { rootLogger } from '../logger';
import { defaultPathResolver } from '../objectTree';
import * as fuse from 'node-fuse-bindings';

export class FUSEFacade {
  private logger = rootLogger.getLogger(this.constructor.name);

  constructor(
    private readonly rootNode: FUSETreeNode,
    private readonly fdStorage: FileDescriptorStorage,
  ) {}

  private splitPath(path: string): string[] {
    return path.substring(1).split('/').filter(Boolean);
  }

  async create(path: string, mode: number): Promise<number> {
    this.logger.info(`create(${path})`);

    const dirs = this.splitPath(path);
    const name = dirs.pop()!;

    const node = await this.safeGetNode('/' + dirs.join('/'));

    await node.create(name, mode);
    const fd = this.fdStorage.openWO();

    return fd.fd;
  }

  async getattr(path: string): Promise<fuse.Stats> {
    this.logger.info(`getattr(${path})`);
    return (await this.safeGetNode(path)).getattr();
  }

  async open(path: string, flags: number): Promise<number> {
    this.logger.info(`open(${path})`);

    const node = await this.safeGetNode(path);

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

  async readdir(path: string): Promise<string[]> {
    this.logger.info(`readdir(${path})`);

    const node = await this.safeGetNode(path);

    return (await node?.children()).map((child) => child.name);
  }

  async release(path: string, fd: number): Promise<0> {
    this.logger.info(`release(${fd})`);

    const fdObject = this.fdStorage.get(fd);
    if (!fdObject) {
      throw new FUSEError(fuse.EBADF, 'invalid fd');
    }

    const node = await this.safeGetNode(path);

    await node.writeAll(fdObject.binary);
    this.fdStorage.release(fd);

    return 0;
  }

  async rmdir(path: string): Promise<0> {
    this.logger.info(`rmdir(${path})`);

    const node = await this.safeGetNode(path);

    if (node.isLeaf) {
      throw new FUSEError(fuse.EACCES, 'invalid path');
    }

    await node.remove();
    return 0;
  }

  async safeGetNode(path: string): Promise<FUSETreeNode> {
    const node = await defaultPathResolver(this.rootNode, this.splitPath(path));
    if (!node) {
      throw new FUSEError(fuse.ENOENT, 'not found');
    }

    return node;
  }

  async unlink(path: string): Promise<0> {
    this.logger.info(`unlink(${path})`);

    const node = await this.safeGetNode(path);

    if (!node.isLeaf) {
      throw new FUSEError(fuse.EACCES, 'invalid path');
    }

    await node.remove();
    return 0;
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
}

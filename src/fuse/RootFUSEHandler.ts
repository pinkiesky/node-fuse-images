import { Stats } from 'node-fuse-bindings';
import { FUSEError } from './FUSEError';
import { FUSETreeNode } from './FUSETreeNode';

export class RootFUSEHandler implements FUSETreeNode {
  name = 'Root Node';
  isLeaf = false;

  constructor(private readonly _children: FUSETreeNode[]) {}

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

  open(flags: number): Promise<void> {
    throw FUSEError.accessDenied();
  }

  readAll(): Promise<Buffer> {
    throw FUSEError.accessDenied();
  }

  writeAll(b: Buffer): Promise<void> {
    throw FUSEError.accessDenied();
  }

  remove(): Promise<void> {
    throw FUSEError.accessDenied();
  }
}

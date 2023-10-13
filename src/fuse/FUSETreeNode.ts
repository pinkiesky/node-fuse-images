import { ObjectTreeNode } from '../objectTree';
import { FUSEError } from './FUSEError';
import { IFUSEHandler } from './IFUSEHandler';

export interface FUSETreeNode extends ObjectTreeNode, IFUSEHandler {}

export abstract class FileFUSETreeNode implements FUSETreeNode {
  abstract name: string;

  abstract getattr(): Promise<any>;
  abstract open(flags: number): Promise<void>;
  abstract readAll(): Promise<Buffer>;
  abstract writeAll(b: Buffer): Promise<void>;
  abstract remove(): Promise<void>;

  isLeaf = true;

  create(name: string, mode: number): Promise<void> {
    throw FUSEError.notADirectory();
  }

  async children(): Promise<FUSETreeNode[]> {
    return [];
  }
}

export abstract class DirectoryFUSETreeNode implements FUSETreeNode {
  abstract name: string;

  abstract create(name: string, mode: number): Promise<void>;
  abstract getattr(): Promise<any>;
  abstract remove(): Promise<void>;
  abstract children(): Promise<ObjectTreeNode[]>;

  isLeaf = false;

  open(flags: number): Promise<void> {
    throw FUSEError.notAFile();
  }

  readAll(): Promise<Buffer> {
    throw FUSEError.notAFile();
  }

  writeAll(b: Buffer): Promise<void> {
    throw FUSEError.notAFile();
  }
}

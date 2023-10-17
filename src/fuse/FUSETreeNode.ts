import { ObjectTreeNode } from '../objectTree';
import { FUSEError } from './FUSEError';
import { IFUSEHandler } from './IFUSEHandler';

export interface FUSETreeNode extends ObjectTreeNode, IFUSEHandler {}

export abstract class FileFUSETreeNode implements FUSETreeNode {
  isLeaf = true;
  abstract name: string;

  async children(): Promise<FUSETreeNode[]> {
    return [];
  }

  create(): Promise<void> {
    throw FUSEError.notADirectory();
  }

  abstract getattr(): Promise<any>;
  abstract open(flags: number): Promise<void>;
  abstract readAll(): Promise<Buffer>;
  abstract remove(): Promise<void>;
  abstract writeAll(b: Buffer): Promise<void>;
}

export abstract class DirectoryFUSETreeNode implements FUSETreeNode {
  isLeaf = false;
  abstract name: string;
  abstract children(): Promise<ObjectTreeNode[]>;
  abstract create(name: string, mode: number): Promise<void>;
  abstract getattr(): Promise<any>;

  open(): Promise<void> {
    throw FUSEError.notAFile();
  }

  readAll(): Promise<Buffer> {
    throw FUSEError.notAFile();
  }

  abstract remove(): Promise<void>;

  writeAll(): Promise<void> {
    throw FUSEError.notAFile();
  }
}

import { ObjectTreeNode } from '../objectTree';
import { FUSEError } from './FUSEError';
import { IFUSEHandler } from './IFUSEHandler';

export interface IFUSETreeNode extends ObjectTreeNode, IFUSEHandler {}

export abstract class FileFUSETreeNode implements IFUSETreeNode {
  isLeaf = true;
  abstract name: string;

  async children(): Promise<IFUSETreeNode[]> {
    return [];
  }

  create(): Promise<void> {
    throw FUSEError.notADirectory();
  }

  abstract getattr(): any;
  abstract checkAvailability(flags: number): Promise<void>;
  abstract readAll(): Promise<Buffer>;
  abstract remove(): Promise<void>;
  abstract writeAll(b: Buffer): Promise<void>;
}

export abstract class DirectoryFUSETreeNode implements IFUSETreeNode {
  isLeaf = false;
  abstract name: string;
  abstract children(): Promise<IFUSETreeNode[]>;
  abstract create(name: string, mode: number): Promise<void>;
  abstract getattr(): any;

  checkAvailability(): Promise<void> {
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

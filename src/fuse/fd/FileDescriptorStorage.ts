import {
  IFileDescriptor,
} from './FileDescriptor';

export interface IFileDescriptorStorage {
  openRO(b: Buffer): IFileDescriptor;
  openWO(): IFileDescriptor;

  get(fd: number): IFileDescriptor | null;
  release(fd: number): void;
}


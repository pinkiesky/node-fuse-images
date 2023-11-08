import * as fuse from 'node-fuse-bindings';
import { FUSEError } from '../FUSEError';
import { IFileDescriptorStorage } from './FileDescriptorStorage';
import { IFileDescriptor } from './FileDescriptor';

export class InMemoryFileDescriptorStorage implements IFileDescriptorStorage {
  private readonly fds = new Map<number, IFileDescriptor>();
  private fdsCounter = 1;

  get(fd: number): IFileDescriptor | null {
    const fileDescriptor = this.fds.get(fd);
    if (!fileDescriptor) {
      return null;
    }

    return fileDescriptor;
  }

  openRO(b: Buffer): IFileDescriptor {
    const fileDescriptor = new ReadFileDescriptor(this.fdsCounter++, b);

    this.fds.set(fileDescriptor.fd, fileDescriptor);

    return fileDescriptor;
  }

  openWO(): IFileDescriptor {
    const fileDescriptor = new WriteFileDescriptor(this.fdsCounter++);

    this.fds.set(fileDescriptor.fd, fileDescriptor);

    return fileDescriptor;
  }

  release(fd: number): void {
    this.fds.delete(fd);
  }
}

export class ReadWriteFileDescriptor implements IFileDescriptor {
  get size(): number {
    return this.binary.length;
  }

  constructor(
    public readonly fd: number,
    public binary: Buffer,
  ) {}

  readToBuffer(buffer: Buffer, len: number, pos: number): number {
    if (pos >= this.binary.length) {
      return 0;
    }

    const num = this.binary.copy(buffer, 0, pos, pos + len);
    return num;
  }

  writeToBuffer(buffer: Buffer, length: number, offset: number): number {
    if (offset + length > this.binary.length) {
      this.binary = Buffer.concat([
        this.binary,
        Buffer.alloc(offset + length - this.binary.length, 0),
      ]);
    }

    buffer.copy(this.binary, offset, 0, length);

    return length;
  }
}

export class ReadFileDescriptor extends ReadWriteFileDescriptor {
  get size(): number {
    return this.binary.length;
  }

  constructor(fd: number, binary: Buffer) {
    super(fd, binary);
  }

  writeToBuffer(): number {
    throw new FUSEError(fuse.EBADF, 'invalid fd');
  }
}

export class WriteFileDescriptor extends ReadWriteFileDescriptor {
  constructor(public readonly fd: number) {
    super(fd, Buffer.alloc(0));
  }

  readToBuffer(): number {
    throw new FUSEError(fuse.EBADF, 'invalid fd');
  }
}

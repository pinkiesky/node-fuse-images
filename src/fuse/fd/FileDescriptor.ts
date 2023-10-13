import * as fuse from 'node-fuse-bindings';
import { FUSEError } from '../FUSEError';

export interface FileDescriptor {
  fd: number;
  size: number;

  binary: Buffer;

  readToBuffer(buffer: Buffer, len: number, pos: number): number;
  writeToBuffer(buffer: Buffer, length: number, offset: number): number;
}

export class ReadFileDescriptor implements FileDescriptor {
  constructor(
    public readonly fd: number,
    public readonly binary: Buffer,
  ) {}

  get size(): number {
    return this.binary.length;
  }

  readToBuffer(buffer: Buffer, len: number, pos: number): number {
    if (pos >= this.binary.length) {
      return 0;
    }

    const num = this.binary.copy(buffer, 0, pos, pos + len);
    return num;
  }

  writeToBuffer(): number {
    throw new FUSEError(fuse.EBADF, 'invalid fd');
  }
}

export class WriteFileDescriptor implements FileDescriptor {
  private buffer: Buffer = Buffer.alloc(0);

  constructor(public readonly fd: number) {}

  get size(): number {
    return this.buffer.length;
  }

  get binary(): Buffer {
    return this.buffer;
  }

  readToBuffer(): number {
    throw new FUSEError(fuse.EBADF, 'invalid fd');
  }

  writeToBuffer(buffer: Buffer, length: number, offset: number): number {
    if (offset + length > this.buffer.length) {
      this.buffer = Buffer.concat([
        this.buffer,
        Buffer.alloc(offset + length - this.buffer.length, 0),
      ]);
    }

    buffer.copy(this.buffer, offset, 0, length);

    return length;
  }
}

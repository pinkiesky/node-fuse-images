import {
  FileDescriptor,
  ReadFileDescriptor,
  WriteFileDescriptor,
} from './FileDescriptor';

export interface FileDescriptorStorage {
  openRO(b: Buffer): ReadFileDescriptor;
  openWO(): WriteFileDescriptor;

  get(fd: number): FileDescriptor | null;
  release(fd: number): void;
}

export class InMemoryFileDescriptorStorage implements FileDescriptorStorage {
  private fdsCounter = 1;
  private readonly fds = new Map<number, FileDescriptor>();

  openRO(b: Buffer): ReadFileDescriptor {
    const fileDescriptor = new ReadFileDescriptor(this.fdsCounter++, b);

    this.fds.set(fileDescriptor.fd, fileDescriptor);

    return fileDescriptor;
  }

  openWO(): WriteFileDescriptor {
    const fileDescriptor = new WriteFileDescriptor(this.fdsCounter++);

    this.fds.set(fileDescriptor.fd, fileDescriptor);

    return fileDescriptor;
  }

  get(fd: number): FileDescriptor | null {
    const fileDescriptor = this.fds.get(fd);
    if (!fileDescriptor) {
      return null;
    }

    return fileDescriptor;
  }

  release(fd: number): void {
    this.fds.delete(fd);
  }
}

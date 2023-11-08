export interface IFileDescriptor {
  fd: number;
  size: number;

  binary: Buffer;

  readToBuffer(buffer: Buffer, len: number, pos: number): number;
  writeToBuffer(buffer: Buffer, length: number, offset: number): number;
}


import * as fuse from 'node-fuse-bindings';

export interface IFUSEHandler {
  name: string;

  create(name: string, mode: number): Promise<void>;
  getattr(): Promise<fuse.Stats>;
  checkAvailability(flags: number): Promise<void>;
  readAll(): Promise<Buffer>;
  writeAll(b: Buffer): Promise<void>;
  remove(): Promise<void>;
}

import { join } from 'path';
import { promises as fs } from 'fs';
import { IBinaryStorage } from './IBinaryStorage';

export class FSBinaryStorage implements IBinaryStorage {
  constructor(private readonly mountPath: string) {}

  private getPath(id: string): string {
    return join(this.mountPath, id);
  }

  load(id: string): Promise<Buffer> {
    return fs.readFile(this.getPath(id));
  }

  remove(id: string): Promise<void> {
    return fs.unlink(this.getPath(id));
  }

  write(id: string, binary: Buffer): Promise<void> {
    return fs.writeFile(this.getPath(id), binary);
  }
}

export interface IBinaryStorage {
  load(id: string): Promise<Buffer | null>;
  write(id: string, binary: Buffer): Promise<void>;
  remove(id: string): Promise<void>;
}

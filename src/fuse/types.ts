export class FUSEPath {
  constructor(
    public readonly fullPath: string,
    public readonly name: string,
    public readonly tail: string[],
  ) {}

  get isEnd(): boolean {
    return !this.tail;
  }

  get next(): FUSEPath | null {
    if (this.isEnd) {
      return null;
    }

    const [head, ...rest] = this.tail;
    return new FUSEPath(this.fullPath, head, rest);
  }

  static parse(path: string) {
    if (!path.startsWith('/')) {
      throw new Error(`Path must start with '/': ${path}`);
    }

    const [root, ...rest] = path.split('/');
    return new FUSEPath(path, root, rest);
  }
}
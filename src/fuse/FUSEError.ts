import * as fuse from 'node-fuse-bindings';

export class FUSEError extends Error {
  constructor(
    public readonly code: number,
    public readonly description?: string,
  ) {
    const msg = description ? `${code}: ${description}` : `${code}`;
    super(msg);
  }

  static notFound(description: string = 'Not found'): FUSEError {
    return new FUSEError(fuse.ENOENT, description);
  }

  static notImplemented(description: string = 'Not implemented'): FUSEError {
    return new FUSEError(fuse.ENOSYS, description);
  }

  static accessDenied(description: string = 'Access denied'): FUSEError {
    return new FUSEError(fuse.EACCES, description);
  }

  static notADirectory(description: string = 'Not a directory'): FUSEError {
    return new FUSEError(fuse.ENOTDIR, description);
  }

  static notAFile(description: string = 'Not a file'): FUSEError {
    return new FUSEError(fuse.EISDIR, description);
  }
}

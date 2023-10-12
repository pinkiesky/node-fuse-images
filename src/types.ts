import { ImageMetaStorage } from './images/ImageMetaStorage';
import { rootLogger } from './logger';
import { ObjectTreeNode } from './objectTree';
import * as fuse from 'node-fuse-bindings';

export interface ImageMeta {
  id: string;
  name: string;
}

export interface ImageBinary {
  buffer: Buffer;
  size: number;
}

export interface Image {
  meta: ImageMeta;
  binary: ImageBinary;
}

export type ImageID = ImageMeta['id'];

type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif';

interface BinaryLoader {
  load(image: ImageMeta): Promise<Image>;
  write(image: Image): Promise<void>;
}

export interface ImageVariant {
  generate(image: ImageBinary): Promise<ImageBinary>;
}

export class ImageOriginalVariant implements ImageVariant {
  async generate(image: ImageBinary): Promise<ImageBinary> {
    return image;
  }
}

// create -- only name
// write -- fd
// readdir -- path
// getattr -- path
// open -- path
// read -- fd
// release -- fd

class FUSEPath {
  constructor(
    public readonly path: string,
    public readonly imageName: string,
    public readonly variantPath: string[],
  ) {}

  get isRoot(): boolean {
    return this.path === '/';
  }

  get isImage(): boolean {
    return this.variantPath.length === 0 && !!this.imageName;
  }

  get isVariant(): boolean {
    return this.variantPath.length > 0 && !!this.imageName;
  }

  get isValid(): boolean {
    return this.isRoot || this.isImage || this.isVariant;
  }

  static parse(path: string) {
    const [root, imageName, ...variantPath] = path.split('/');
    return new FUSEPath(path, imageName, variantPath);
  }
}

export class FUSEError extends Error {
  constructor(
    public readonly code: number,
    public readonly description?: string,
  ) {
    const msg = description ? `${code}: ${description}` : `${code}`;
    super(msg);
  }
}

export class FUSEHandler {
  private logger = rootLogger.getLogger(this.constructor.name);

  constructor(
    private readonly imageMetaStorage: ImageMetaStorage,
    private readonly rootNode: ObjectTreeNode<ImageVariant>,
  ) {
    if (rootNode.isLeaf) {
      throw new Error('Root node cannot be leaf');
    }
  }

  async getattr(path: string): Promise<fuse.Stats> {
    this.logger.info(`getattr(${path})`);

    const fusePath = FUSEPath.parse(path);
    if (fusePath.isRoot) {
      // @ts-expect-error
      return {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        nlink: 1,
        size: 100,
        mode: 16877,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0,
      };
    }

    const imageMeta = await this.imageMetaStorage.get(fusePath.imageName);
    if (!imageMeta) {
      throw new FUSEError(fuse.ENOENT, 'meta not found');
    }

    if (fusePath.isImage) {
      // @ts-expect-error
      return {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        nlink: 1,
        size: 100,
        mode: 16877,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0,
      };
    }

    if (!fusePath.isVariant) {
      throw new FUSEError(fuse.EACCES, 'invalid path');
    }

    const variant = this.rootNode.resolvePath(fusePath.variantPath);
    if (!variant) {
      throw new FUSEError(fuse.ENOENT, 'variant not found');
    }

    if (variant.isLeaf) {
      // @ts-expect-error
      return {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        nlink: 1,
        size: 1000,
        mode: 33188,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0,
      };
    }

    // @ts-expect-error
    return {
      mtime: new Date(),
      atime: new Date(),
      ctime: new Date(),
      nlink: 1,
      size: 1000,
      mode: 16877,
      uid: process.getuid ? process.getuid() : 0,
      gid: process.getgid ? process.getgid() : 0,
    };
  }

  async readdir(path: string): Promise<string[]> {
    this.logger.info(`readdir(${path})`);

    const fusePath = FUSEPath.parse(path);
    if (fusePath.isRoot) {
      return (await this.imageMetaStorage.list()).map((image) => image.name);
    }

    const imageMeta = await this.imageMetaStorage.get(fusePath.imageName);
    if (!imageMeta) {
      throw new FUSEError(fuse.ENOENT, 'meta not found');
    }

    const variant = this.rootNode.resolvePath(fusePath.variantPath);
    if (!variant) {
      throw new FUSEError(fuse.ENOENT, 'variant not found');
    }

    if (!variant.isLeaf) {
      return variant.children.map((child) => child.name);
    }

    throw new FUSEError(fuse.ENOENT, 'not a leaf');
  }

  async create(path: string, mode: number): Promise<0> {
    this.logger.info(`create(${path}, ${mode})`);

    const fusePath = FUSEPath.parse(path);
    if (!fusePath.imageName || fusePath.variantPath.length > 0) {
      throw new FUSEError(fuse.EACCES, 'invalid path');
    }

    const mbImageMeta = await this.imageMetaStorage.get(fusePath.imageName);
    if (mbImageMeta) {
      throw new FUSEError(fuse.EEXIST, 'exist');
    }

    const imageMeta = await this.imageMetaStorage.create(fusePath.imageName);
    this.logger.info(`Created image ${imageMeta.name} with id ${imageMeta.id}`);

    return 0;
  }

  async open()
}

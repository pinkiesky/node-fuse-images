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

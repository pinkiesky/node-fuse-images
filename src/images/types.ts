import { MimeType } from '../utils/mimeType';

export interface ImageMeta {
  id: string;
  name: string;
  originalFileName: string;
  originalFileType: MimeType;
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

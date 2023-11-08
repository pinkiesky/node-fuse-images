import { ImageMeta, Image } from '../types';

export interface IImageGenerator {
  generate(meta: ImageMeta, rawBuffer: Buffer): Promise<Image | null>;
}

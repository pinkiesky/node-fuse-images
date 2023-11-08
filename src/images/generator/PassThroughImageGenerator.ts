import { getMimeTypeType } from '../../utils/mimeType';
import { ImageMeta, Image } from '../types';
import { IImageGenerator } from './IImageGenerator';

export class PassThroughImageGenerator implements IImageGenerator {
  async generate(meta: ImageMeta, rawBuffer: Buffer): Promise<Image | null> {
    if (getMimeTypeType(meta.originalFileType) !== 'image') {
      return null;
    }

    return {
      meta,
      binary: {
        buffer: rawBuffer,
        size: rawBuffer.length,
      },
    };
  }
}

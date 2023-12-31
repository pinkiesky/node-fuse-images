import { Image, ImageBinary } from '../types';
import { IImageVariant } from './IImageVariant';
import { ImageFormat } from './types';
import sharp from 'sharp';

export class ImageOriginalVariant implements IImageVariant {
  constructor(private readonly outputFormat: ImageFormat) {}

  async generate(image: Image): Promise<ImageBinary> {
    const result = await sharp(image.binary.buffer)
      .toFormat(this.outputFormat)
      .toBuffer();

    return {
      buffer: result,
      size: result.byteLength,
    };
  }
}

import { bound, randInt } from '../../utils/math';
import { Image, ImageBinary } from '../types';
import { IImageVariant, ImageFormat } from './types';
import sharp from 'sharp';

export class ImageAlwaysRandomVariant implements IImageVariant {
  constructor(private readonly outputFormat: ImageFormat) {}

  async generate(image: Image): Promise<ImageBinary> {
    console.count('ImageOriginalVariant.generate');
    const sharpImage = sharp(image.binary.buffer);

    const metadata = await sharpImage.metadata();
    const buffer = await sharpImage.raw().toBuffer();

    for (let i = 0; i < buffer.length; i++) {
      if (metadata.channels === 4 && i % 4 === 3) {
        continue;
      }

      const r = randInt(-10, 10);
      buffer[i] = bound(buffer[i] + r, 0, 255);
    }

    const result = await sharp(buffer, {
      raw: {
        width: metadata.width!,
        height: metadata.height!,
        channels: metadata.channels!,
      },
    })
      .toFormat(this.outputFormat)
      .toBuffer();

    return {
      buffer: result,
      size: result.length,
    };
  }
}

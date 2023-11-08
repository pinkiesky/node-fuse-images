import { randInt } from '../../utils/math';
import { Image, ImageBinary } from '../types';
import { IImageVariant } from './IImageVariant';
import { ImageFormat } from './types';
import sharp from 'sharp';

export class ImageAlwaysRandomVariant implements IImageVariant {
  private readonly randomSquareEdgeSizePx = 16;

  constructor(private readonly outputFormat: ImageFormat) {}

  async generate(image: Image): Promise<ImageBinary> {
    const sharpImage = sharp(image.binary.buffer);

    const metadata = await sharpImage.metadata();
    const buffer = await sharpImage.raw().toBuffer();

    for (let y = 0; y < this.randomSquareEdgeSizePx; y++) {
      for (let x = 0; x < this.randomSquareEdgeSizePx; x++) {
        const offset =
          y * metadata.width! * metadata.channels! + x * metadata.channels!;
        buffer[offset + 0] = randInt(0, 255);
        buffer[offset + 1] = randInt(0, 255);
        buffer[offset + 2] = randInt(0, 255);

        if (metadata.channels === 4) {
          buffer[offset + 3] = 255;
        }
      }
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

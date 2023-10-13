import { Image, ImageBinary } from '../types';
import { IImageVariant, ImageFormat } from './types';
import sharp from 'sharp';
import * as pureimage from 'pureimage';
import { streamToBuffer } from '../../utils/stream';
import { PassThrough } from 'stream';

const TEXT_SIZE_PX = 20;
const TEXT_MARGIN_LEFT_PX = 5;

export class ImageWithTextVariant implements IImageVariant {
  constructor(
    private readonly outputFormat: ImageFormat,
    private readonly text: string,
  ) {}

  async generate(image: Image): Promise<ImageBinary> {
    const sharpImage = sharp(image.binary.buffer).png();
    const img = await pureimage.decodePNGFromStream(sharpImage);

    const ctx = img.getContext('2d');

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(TEXT_MARGIN_LEFT_PX - 3, 0, 40, TEXT_SIZE_PX * 1.5);

    ctx.fillStyle = 'black';
    ctx.font = `${TEXT_SIZE_PX}px Open Sans`;
    ctx.fillText(this.text, TEXT_MARGIN_LEFT_PX, TEXT_SIZE_PX);
    
    const stream = new PassThrough();
    const s2b = streamToBuffer(stream);
    pureimage.encodePNGToStream(img, stream);

    let buffer = await s2b;
    if (this.outputFormat !== 'png') {
      const image = sharp(buffer);
      buffer = await image.toFormat(this.outputFormat).toBuffer();
    }

    return {
      buffer: buffer,
      size: buffer.length,
    };
  }
}

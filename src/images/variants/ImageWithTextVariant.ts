import { Image, ImageBinary } from '../types';
import { IImageVariant, ImageFormat } from './types';
import sharp from 'sharp';
import { createCanvas, loadImage } from 'canvas';
import { streamToBuffer } from '../../utils/stream';
import { PassThrough } from 'stream';
import { promisify } from 'util';
import { loadImageFromBuffer } from '../../utils/canvas';

const TEXT_SIZE_PX = 30;
const TEXT_MARGIN_LEFT_PX = 5;

export class ImageWithTextVariant implements IImageVariant {
  constructor(
    private readonly outputFormat: ImageFormat,
    private readonly text: string,
  ) {}

  async generate(image: Image): Promise<ImageBinary> {
    console.log('data?');
    const sharpImage = sharp(image.binary.buffer).png();
    const canvas = await loadImageFromBuffer(await sharpImage.toBuffer());
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'black';
    ctx.font = `${TEXT_SIZE_PX}px Open Sans`;
    ctx.translate(TEXT_MARGIN_LEFT_PX, TEXT_SIZE_PX);
    ctx.fillText(this.text, 0, 0);
    ctx.strokeText(this.text, 0, 0);

    let buffer = canvas.toBuffer('image/png');

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

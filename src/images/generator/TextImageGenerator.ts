import { MimeType } from '../../utils/mimeType';
import { ImageMeta, Image } from '../types';
import { createCanvas } from 'canvas';
import { IImageGenerator } from './IImageGenerator';

const IMAGE_SIZE_RE = /(\d+)x(\d+)/;

export class TextImageGenerator implements IImageGenerator {
  async generate(meta: ImageMeta, rawBuffer: Buffer): Promise<Image | null> {
    if (meta.originalFileType !== MimeType.TXT) {
      return null;
    }

    const imageSize = {
      width: 800,
      height: 600,
    };
    const imageSizeRaw = IMAGE_SIZE_RE.exec(meta.name);
    if (imageSizeRaw) {
      imageSize.width = Number(imageSizeRaw[1]) || imageSize.width;
      imageSize.height = Number(imageSizeRaw[2]) || imageSize.height;
    }

    const imageText = rawBuffer.toString('utf-8');

    const canvas = createCanvas(imageSize.width, imageSize.height);
    const ctx = canvas.getContext('2d');
    ctx.textAlign = 'start';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, imageSize.width, imageSize.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = '30px Open Sans';
    ctx.fillText(imageText, 10, 10);

    return {
      meta,
      binary: {
        buffer: canvas.toBuffer('image/png'),
        size: rawBuffer.length,
      },
    };
  }
}

import { MimeType, getMimeTypeType } from '../../utils/mimeType';
import { ImageMeta, Image } from '../types';
import { createCanvas } from 'canvas';

export interface IImageGenerator {
  generateImage(meta: ImageMeta, binary: Buffer): Promise<Image | null>;
}

export class ImageGeneratorContainer {
  private readonly generators: IImageGenerator[] = [];

  addGenerator(generator: IImageGenerator): void {
    this.generators.push(generator);
  }

  async buildImage(meta: ImageMeta, binary: Buffer): Promise<Image | null> {
    for (const generator of this.generators) {
      const image = await generator.generateImage(meta, binary);
      if (image) {
        return image;
      }
    }

    return null;
  }
}

export class PassThroughImageGenerator implements IImageGenerator {
  async generateImage(meta: ImageMeta, binary: Buffer): Promise<Image | null> {
    if (getMimeTypeType(meta.originalFileType) !== 'image') {
      return null;
    }

    return {
      meta,
      binary: {
        buffer: binary,
        size: binary.length,
      },
    };
  }
}

const IMAGE_SIZE_RE = /(\d+)x(\d+)/;
export class TextImageGenerator implements IImageGenerator {
  async generateImage(meta: ImageMeta, binary: Buffer): Promise<Image | null> {
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

    const imageText = binary.toString('utf-8');
    console.log(imageText);

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
        size: binary.length,
      },
    };
  }
}

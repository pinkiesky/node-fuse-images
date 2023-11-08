import { ImageMeta, Image } from '../types';
import { IImageGenerator } from './IImageGenerator';

export class ImageGeneratorComposite implements IImageGenerator {
  private readonly generators: IImageGenerator[] = [];

  addGenerator(generator: IImageGenerator): void {
    this.generators.push(generator);
  }

  async generate(meta: ImageMeta, rawBuffer: Buffer): Promise<Image | null> {
    for (const generator of this.generators) {
      const image = await generator.generate(meta, rawBuffer);
      if (image) {
        return image;
      }
    }

    return null;
  }
}

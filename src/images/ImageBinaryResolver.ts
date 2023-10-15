import { BinaryStorage } from './BinaryStorage';
import { ImageGeneratorContainer } from './generator/IImageGenerator';
import { ImageMeta, Image } from './types';

export class ImageBinaryResolver {
  constructor(
    private readonly storage: BinaryStorage,
    private readonly generatorContainer: ImageGeneratorContainer,
  ) {}

  async load(image: ImageMeta): Promise<Image | null> {
    const binary = await this.storage.load(image.id);
    if (!binary) {
      return null;
    }

    return this.generatorContainer.buildImage(image, binary);
  }
}

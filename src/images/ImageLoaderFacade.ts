import { IBinaryStorage } from '../binaryStorage/IBinaryStorage';
import { ImageGeneratorComposite } from './generator/ImageGeneratorComposite';
import { ImageMeta, Image } from './types';

export class ImageLoaderFacade {
  constructor(
    private readonly storage: IBinaryStorage,
    private readonly generatorContainer: ImageGeneratorComposite,
  ) {}

  async load(image: ImageMeta): Promise<Image | null> {
    const binary = await this.storage.load(image.id);
    if (!binary) {
      return null;
    }

    return this.generatorContainer.generate(image, binary);
  }
}

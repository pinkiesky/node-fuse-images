import { ImageBinary, Image } from '../types';
import { ICache } from '../../cache/Cache';
import { IImageVariant } from './IImageVariant';

export class ImageCacheWrapper implements IImageVariant {
  private readonly cacheId: string;

  constructor(
    cacheIdParts: string[],
    private readonly cache: ICache<ReturnType<IImageVariant['generate']>>,
    private readonly variant: IImageVariant,
  ) {
    this.cacheId = cacheIdParts.join('-');
  }

  async generate(image: Image): Promise<ImageBinary> {
    const key = `${this.cacheId}:${image.meta.id}`;

    const cached = await this.cache.get(key);
    if (cached) {
      return cached;
    }

    const result = this.variant.generate(image);
    this.cache.set(key, result);

    return result;
  }
}

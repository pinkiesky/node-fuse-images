import { ImageBinary, Image } from '../types';

export interface IImageVariant {
  generate(image: Image): Promise<ImageBinary>;
}

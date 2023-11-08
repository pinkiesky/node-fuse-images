import { ImageID, ImageMeta } from '../types';

export interface IImageMetaStorage {
  list(): Promise<ImageMeta[]>;

  get(name: ImageID): Promise<ImageMeta | null>;
  create(name: ImageID): Promise<ImageMeta>;
  remove(name: ImageID): Promise<boolean>;
}

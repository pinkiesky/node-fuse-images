import { ImageMetaStorage } from './images/ImageMetaStorage';

export class ImageFacade {
  constructor(private readonly imageMetaStorage: ImageMetaStorage, private readonly binaryLoader: BinaryLoader) {}
}

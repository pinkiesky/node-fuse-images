import sharp from 'sharp';
import { ImageBinary, Image } from '../types';

export interface IImageVariant {
  generate(image: Image): Promise<ImageBinary>;
}

export type ImageFormat = keyof sharp.FormatEnum;

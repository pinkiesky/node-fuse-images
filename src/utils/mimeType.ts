import { getExtension } from './filenames';

export enum MimeType {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  GIF = 'image/gif',
  WEBP = 'image/webp',
  SVG = 'image/svg+xml',
  JSON = 'application/json',
  TXT = 'text/plain',
}

export function getMimeTypeType(mimeType: MimeType) {
  return mimeType.split('/')[0];
}

export function getMimeTypeSubtype(mimeType: MimeType) {
  return mimeType.split('/')[1];
}

export function filenameToMimeType(filename: string): MimeType | null {
  const extension = getExtension(filename);
  console.log(filename, extension);
  return extensionToMimeType(extension);
}

export function extensionToMimeType(extension: string): MimeType | null {
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return MimeType.JPEG;
    case '.png':
      return MimeType.PNG;
    case '.gif':
      return MimeType.GIF;
    case '.webp':
      return MimeType.WEBP;
    case '.svg':
      return MimeType.SVG;
    case '.json':
      return MimeType.JSON;
    case '.txt':
      return MimeType.TXT;
    default:
      return null;
  }
}

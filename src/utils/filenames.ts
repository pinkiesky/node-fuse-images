import path from 'path';

export function removeExtension(filename: string) {
  return path.parse(filename).name;
}

export function getExtension(filename: string) {
  return path.parse(filename).ext;
}

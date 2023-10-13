import path from 'path';

export function removeExtension(filename: string) {
  return path.parse(filename).name;
}

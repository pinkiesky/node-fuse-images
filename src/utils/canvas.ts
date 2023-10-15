import { loadImage, createCanvas, Canvas } from 'canvas';

export async function loadImageFromBuffer(buffer: Buffer): Promise<Canvas> {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(image, 0, 0);

  return canvas;
}

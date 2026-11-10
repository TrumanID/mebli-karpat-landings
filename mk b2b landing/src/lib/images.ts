import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('/assets/originals/*.jpg', { eager: true });
export function photo(name: string): ImageMetadata {
  const file = files[`/assets/originals/${name}`];
  if (!file) throw new Error(`Missing image: assets/originals/${name}`);
  return file.default;
}

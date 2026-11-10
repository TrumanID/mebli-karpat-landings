import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/products/*.jpg', { eager: true });
export function productImage(name: string): ImageMetadata {
  const hit = files[`../assets/products/${name}`];
  if (!hit) throw new Error(`Missing product image: ${name}`);
  return hit.default;
}

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const localeEntry = z.object({
  descriptor: z.string().min(1),
  description: z.string(),
  features: z.array(z.string()),
  imageAlt: z.array(z.string().min(1)).min(1),
  status: z.enum(['machine_draft', 'reviewed', 'approved']),
  sourceHash: z.string(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
});

/** Product model (SPEC §14.3). `types` and the chair measures extend it for the §6 filters: see docs/decisions.md. */
const products = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/products' }),
  schema: z.object({
    slug: z.string(),
    category: z.enum(['tables', 'chairs']),
    sourceUrl: z.url(),
    name: z.string(),
    i18n: z.record(z.string(), localeEntry),
    woods: z.array(z.enum(['oak', 'beech'])),
    finishes: z.array(z.enum(['oil', 'oil_tint', 'lacquer', 'enamel'])),
    types: z.array(z.enum(['dining', 'bistro', 'round', 'extendable', 'bar', 'upholstered', 'armrests'])),
    useCases: z.array(z.enum(['gastro', 'hotel', 'home'])),
    variants: z.array(z.object({
      id: z.string(),
      lengthMm: z.number().optional(),
      widthMm: z.number().optional(),
      depthMm: z.number().optional(),
      heightMm: z.number().optional(),
      seatHeightMm: z.number().optional(),
      wood: z.string().optional(),
      extension: z.boolean().optional(),
      upholstery: z.string().optional(),
    })),
    images: z.array(z.object({ src: z.string(), width: z.number(), height: z.number() })),
    downloads: z.object({ specPdf: z.string().optional(), cad: z.string().optional(), model3d: z.string().optional() }).optional(),
    leadTimeDays: z.number().optional(),
    moq: z.number().optional(),
    hsCode: z.string().optional(),
    tradePriceFromEur: z.number().optional(),
    hold: z.boolean().optional(),
    lastUpdated: z.string(),
  }),
});

export const collections = { products };

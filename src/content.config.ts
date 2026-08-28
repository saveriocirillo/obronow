import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

// Product data migrated from the legacy obro.pl catalog (see
// scripts/migrate-legacy-catalog.mjs). Each entry is a product family
// (e.g. "PM - płytka montażowa") with one or more SKU variants; the
// dimension columns differ per family, so variant dimensions are a
// free-form record rather than fixed fields.
const products = defineCollection({
  loader: file('./src/content/products/legacy-catalog.json'),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    titleParts: z.array(z.string()),
    category: z.enum([
      'laczniki-do-drewna',
      'tasmy-montazowe',
      'zlacza-ogrodowe',
      'zawiasy',
      'inne',
    ]),
    images: z.array(
      z.object({
        kind: z.enum(['photo', 'technical', 'installation']),
        path: z.string(),
      })
    ),
    dimensionColumns: z.array(z.string()),
    variants: z.array(
      z.object({
        sku: z.string(),
        dimensions: z.record(z.string(), z.string()),
        packageQty: z.string(),
      })
    ),
    // True for legacy pages with photos but no SKU/dimension table
    // (e.g. katalog-58, katalog-59) — need manual review before publishing.
    incomplete: z.boolean().default(false),
  }),
});

export const collections = { products };

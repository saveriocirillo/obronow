import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    category: z.enum(['saldare', 'avvitare', 'regolabili', 'a-scomparsa']),
    material: z.enum(['acciaio-zincato', 'acciaio-inox', 'ferro-battuto', 'ottone']),
    dimensions: z.object({
      pinDiameterMm: z.number().optional(),
      heightMm: z.number().optional(),
      maxLoadKg: z.number().optional(),
    }),
    compatibility: z.array(z.string()),
    // Path relativi a /public — passeremo a immagini ottimizzate (helper image())
    // quando avremo gli asset reali del sito attuale.
    images: z.array(z.string()),
    datasheetPdf: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { products };

/**
 * Adaptadores entre los tipos legados (BlogPost, Episode, Product,
 * NewsletterEdition) y los documentos del motor de contenido (ContentDoc).
 *
 * Son los inversos entre sí: `toDoc` construye el Front Matter canónico que
 * se escribe en `Contenido/` y `toLegacy` reconstruye el objeto legado desde
 * un documento parseado. Al usarse en pares garantizan round-trip estable
 * (lo que se lee de un `.md` es idéntico a lo que se migró desde los TS).
 */
import { parseBlogSections, serializeBlogBody } from './parser';
import type {
  BlogPost,
  ContentDoc,
  ContentMeta,
  Episode,
  NewsletterEdition,
  Product,
  ProductAsset,
  ProductAssetType,
  ProductCurrency,
  ProductFormat,
  ProductType,
} from './types';

const asString = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback;

const asNumber = (v: unknown): number | undefined =>
  typeof v === 'number' ? v : undefined;

const asBool = (v: unknown): boolean | undefined =>
  typeof v === 'boolean' ? v : undefined;

const asArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

const asStringOrNull = (v: unknown): string | null | undefined =>
  v === null ? null : typeof v === 'string' ? v : undefined;

const ASSET_TYPES: ProductAssetType[] = ['pdf', 'audio', 'video', 'zip', 'plantilla', 'otro'];
const PRODUCT_FORMATS: ProductFormat[] = [
  'curso', 'ebook', 'pdf', 'guia', 'checklist', 'plantilla', 'audio',
  'meditacion', 'podcast', 'recurso', 'workshop', 'clase-en-vivo',
];

const parseAsset = (v: unknown): ProductAsset | undefined => {
  if (!v || typeof v !== 'object') return undefined;
  const a = v as Record<string, unknown>;
  const slug = typeof a.slug === 'string' ? a.slug : undefined;
  if (!slug) return undefined;
  const type = ASSET_TYPES.includes(a.type as ProductAssetType)
    ? (a.type as ProductAssetType)
    : 'otro';
  return {
    slug,
    title: asString(a.title, slug),
    fileName: asString(a.fileName, slug),
    mime: asString(a.mime, 'application/octet-stream'),
    sizeBytes: typeof a.sizeBytes === 'number' ? a.sizeBytes : 0,
    type,
    version: typeof a.version === 'number' ? a.version : 1,
    sortOrder: typeof a.sortOrder === 'number' ? a.sortOrder : 0,
  };
};

/* -------------------------------------------------------------------------- */
/* Blog                                                                        */
/* -------------------------------------------------------------------------- */

export function blogPostToDoc(post: BlogPost, order: number): ContentDoc {
  const frontmatter: Record<string, unknown> = {
    kind: 'blog',
    order,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    date: post.date,
    category: post.category,
    readTime: post.readTime,
    ...(post.categories ? { categories: post.categories } : {}),
    ...(post.tags ? { tags: post.tags } : {}),
    ...(post.level ? { level: post.level } : {}),
    ...(post.audience ? { audience: post.audience } : {}),
    icon: post.icon,
    gradient: post.gradient,
    image: post.image,
    status: 'published',
    locale: 'es',
    version: 1,
    createdAt: post.date,
  };
  const meta = frontmatter as unknown as ContentMeta;
  return { ...meta, body: serializeBlogBody(post.sections), frontmatter: meta };
}

export function docToBlogPost(doc: ContentDoc): BlogPost {
  const fm = doc.frontmatter;
  return {
    slug: doc.slug,
    title: doc.title,
    excerpt: asString(fm.excerpt),
    date: asString(fm.date),
    category: asString(fm.category),
    readTime: asString(fm.readTime),
    categories: asArray(fm.categories) as BlogPost['categories'],
    tags: asArray(fm.tags) as BlogPost['tags'],
    level: asString(fm.level) || undefined,
    audience: asArray(fm.audience) as BlogPost['audience'],
    icon: asString(fm.icon),
    gradient: asString(fm.gradient),
    image: asString(fm.image),
    sections: parseBlogSections(doc.body),
  };
}

/* -------------------------------------------------------------------------- */
/* Podcast                                                                     */
/* -------------------------------------------------------------------------- */

export function episodeToDoc(episode: Episode, order: number): ContentDoc {
  const frontmatter: Record<string, unknown> = {
    kind: 'podcast',
    order,
    slug: episode.slug,
    title: episode.title,
    description: episode.description,
    ...(episode.duration ? { duration: episode.duration } : {}),
    ...(episode.series ? { series: episode.series } : {}),
    ...(episode.embedUrl !== undefined ? { embedUrl: episode.embedUrl } : {}),
    ...(episode.spotifyUrl ? { spotifyUrl: episode.spotifyUrl } : {}),
    ...(episode.youtubeUrl ? { youtubeUrl: episode.youtubeUrl } : {}),
    ...(episode.categories ? { categories: episode.categories } : {}),
    ...(episode.tags ? { tags: episode.tags } : {}),
    ...(episode.level ? { level: episode.level } : {}),
    ...(episode.audience ? { audience: episode.audience } : {}),
    icon: episode.icon,
    gradient: episode.gradient,
    image: episode.image,
    status: 'published',
    locale: 'es',
    version: 1,
  };
  const meta = frontmatter as unknown as ContentMeta;
  return { ...meta, body: '', frontmatter: meta };
}

export function docToEpisode(doc: ContentDoc): Episode {
  const fm = doc.frontmatter;
  return {
    slug: doc.slug,
    title: doc.title,
    description: asString(fm.description),
    duration: asString(fm.duration) || undefined,
    series: (asString(fm.series) as Episode['series']) || undefined,
    embedUrl: asStringOrNull(fm.embedUrl),
    spotifyUrl: asString(fm.spotifyUrl) || undefined,
    youtubeUrl: asString(fm.youtubeUrl) || undefined,
    categories: asArray(fm.categories) as Episode['categories'],
    tags: asArray(fm.tags) as Episode['tags'],
    level: asString(fm.level) || undefined,
    audience: asArray(fm.audience) as Episode['audience'],
    icon: asString(fm.icon),
    gradient: asString(fm.gradient),
    image: asString(fm.image),
  };
}

/* -------------------------------------------------------------------------- */
/* Productos                                                                   */
/* -------------------------------------------------------------------------- */

const PRODUCT_TYPE_BY_LEVEL: Record<string, ProductType> = {};

/** Tipo de producto derivado (solo para la migración de datos actuales). */
export const legacyProductType = (slug: string): ProductType =>
  slug === 'bundle-pine-completo'
    ? 'bundle'
    : slug === 'membresia-biblioteca-pine'
      ? 'membership'
      : 'simple';

/** Tipo de producto legado (sin los campos agregados en la subfase). */
export type LegacyProductInput = Omit<Product, 'productType' | 'components'>;

export function productToDoc(product: LegacyProductInput, order: number): ContentDoc {
  const frontmatter: Record<string, unknown> = {
    kind: 'product',
    order,
    slug: product.slug,
    title: product.title,
    subtitle: product.subtitle,
    description: product.description,
    price: product.price,
    ...(product.currency !== undefined && product.currency !== 'USD'
      ? { currency: product.currency }
      : {}),
    ...(product.priceArs !== undefined ? { priceArs: product.priceArs } : {}),
    ...(product.taxRate !== undefined && product.taxRate !== 0 ? { taxRate: product.taxRate } : {}),
    ...(product.sku !== undefined ? { sku: product.sku } : {}),
    ...(product.format !== undefined ? { format: product.format } : {}),
    ...(product.shortDescription !== undefined ? { shortDescription: product.shortDescription } : {}),
    ...(product.author !== undefined ? { author: product.author } : {}),
    ...(product.duration !== undefined ? { duration: product.duration } : {}),
    ...(product.banner !== undefined ? { banner: product.banner } : {}),
    ...(product.gallery && product.gallery.length > 0 ? { gallery: product.gallery } : {}),
    ...(product.related && product.related.length > 0 ? { related: product.related } : {}),
    ...(product.assets && product.assets.length > 0 ? { assets: product.assets } : {}),
    ...(product.compareAt !== undefined ? { compareAt: product.compareAt } : {}),
    ...(product.interval !== undefined ? { interval: product.interval } : {}),
    level: product.level,
    productType: legacyProductType(product.slug),
    ...(product.badge ? { badge: product.badge } : {}),
    ...(product.recommended !== undefined ? { recommended: product.recommended } : {}),
    ...(product.categories ? { categories: product.categories } : {}),
    ...(product.tags ? { tags: product.tags } : {}),
    ...(product.audience ? { audience: product.audience } : {}),
    features: product.features,
    includes: product.includes,
    icon: product.icon,
    gradient: product.gradient,
    image: product.image,
    status: 'published',
    locale: 'es',
    version: 1,
  };
  const meta = frontmatter as unknown as ContentMeta;
  return { ...meta, body: '', frontmatter: meta };
}

export function docToProduct(doc: ContentDoc): Product {
  const fm = doc.frontmatter;
  const level = asString(fm.level);
  const price = asNumber(fm.price);
  if (!level || price === undefined) {
    throw new Error(
      `[Contenido inválido] producto '${doc.slug}': level o price ausentes`
    );
  }
  const rawFormat = asString(fm.format);
  const format = PRODUCT_FORMATS.includes(rawFormat as ProductFormat)
    ? (rawFormat as ProductFormat)
    : undefined;
  return {
    slug: doc.slug,
    title: doc.title,
    subtitle: asString(fm.subtitle),
    description: asString(fm.description),
    price,
    currency:
      fm.currency === 'ARS'
        ? ('ARS' as ProductCurrency)
        : ('USD' as ProductCurrency),
    priceArs: asNumber(fm.priceArs),
    taxRate: typeof fm.taxRate === 'number' ? fm.taxRate : 0,
    sku: asString(fm.sku) || undefined,
    format,
    shortDescription: asString(fm.shortDescription) || undefined,
    author: asString(fm.author) || undefined,
    duration: asString(fm.duration) || undefined,
    banner: asString(fm.banner) || undefined,
    gallery: asArray(fm.gallery) as Product['gallery'],
    related: asArray(fm.related) as Product['related'],
    assets: Array.isArray(fm.assets)
      ? fm.assets.map(parseAsset).filter((a): a is ProductAsset => a !== undefined)
      : undefined,
    compareAt: asNumber(fm.compareAt),
    interval: fm.interval === 'monthly' ? 'monthly' : undefined,
    level: level as Product['level'],
    productType: (['simple', 'bundle', 'membership'].includes(asString(fm.productType))
      ? (asString(fm.productType) as ProductType)
      : 'simple'),
    components: asArray(fm.components) as Product['components'],
    badge: asString(fm.badge) || undefined,
    categories: asArray(fm.categories) as Product['categories'],
    tags: asArray(fm.tags) as Product['tags'],
    audience: asArray(fm.audience) as Product['audience'],
    features: asArray(fm.features),
    includes: asArray(fm.includes),
    icon: asString(fm.icon),
    gradient: asString(fm.gradient),
    image: asString(fm.image),
    recommended: asBool(fm.recommended),
  };
}

/* -------------------------------------------------------------------------- */
/* Newsletter                                                                  */
/* -------------------------------------------------------------------------- */

export function newsletterToDoc(edition: NewsletterEdition, order: number): ContentDoc {
  const frontmatter: Record<string, unknown> = {
    kind: 'newsletter',
    order,
    slug: edition.slug,
    title: edition.title,
    description: edition.description,
    ...(edition.date ? { date: edition.date } : {}),
    ...(edition.categories ? { categories: edition.categories } : {}),
    ...(edition.tags ? { tags: edition.tags } : {}),
    ...(edition.level ? { level: edition.level } : {}),
    ...(edition.audience ? { audience: edition.audience } : {}),
    status: 'published',
    ...(edition.icon ? { icon: edition.icon } : {}),
    ...(edition.gradient ? { gradient: edition.gradient } : {}),
    locale: 'es',
    version: 1,
  };
  const meta = frontmatter as unknown as ContentMeta;
  return { ...meta, body: '', frontmatter: meta };
}

export function docToNewsletterEdition(doc: ContentDoc): NewsletterEdition {
  const fm = doc.frontmatter;
  return {
    slug: doc.slug,
    title: doc.title,
    description: asString(fm.description),
    date: asString(fm.date) || undefined,
    categories: asArray(fm.categories) as NewsletterEdition['categories'],
    tags: asArray(fm.tags) as NewsletterEdition['tags'],
    level: asString(fm.level) || undefined,
    audience: asArray(fm.audience) as NewsletterEdition['audience'],
    status: 'published',
    icon: asString(fm.icon) || undefined,
    gradient: asString(fm.gradient) || undefined,
  };
}

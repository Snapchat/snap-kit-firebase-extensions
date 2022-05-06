import { readFileSync } from 'fs';
import path from 'path';
import get from 'lodash.get';

import sharp, { Metadata } from 'sharp';
import * as yup from 'yup';
import { createHash } from 'crypto';
import { extensionConfiguration } from './config';
import * as admin from 'firebase-admin';
import { ImageObject, Product as ProductSchema, Offer } from 'schema-dts';
import { JSDOM, VirtualConsole } from 'jsdom';
import axios from 'axios';
import nodeHtmlToImage from 'node-html-to-image';

export type Product = {
  // The product's name.
  name: string;
  // The URL to the image of the product.
  imageUrl: string;
  // The display price, e.g. '$10.00'.
  price: string;
};

export type RequestData = {
  url?: string;
  id?: string;
  theme: 'light' | 'dark';
  headline: string;
  cta: string;
};

export type ResponseData = {
  url: string;
  // Only used in development.
  product?: Product;
};

export const schema = yup.object().shape({
  url: yup.string().url(),
  id: yup.string(),
  theme: yup
    .string()
    .matches(/(light|dark)/)
    .default('light'),
  cta: yup.string(),
});

export const firebaseStorageApi =
  process.env.NODE_ENV === 'production'
    ? 'https://firebasestorage.googleapis.com'
    : `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`;

// Returns a cache id for a given request data.
export function getCachedImageHash(data: RequestData): string {
  const orderedKeyData: RequestData = {
    url: data.url,
    id: data.headline,
    theme: data.theme,
    headline: data.headline,
    cta: data.cta,
  };
  const hash = createHash('sha256');
  hash.update(JSON.stringify(orderedKeyData), 'utf-8');
  return hash.digest('hex');
}

// Returns the relative path to the image on the storage bucket.
export function getCachedImagePath(data: RequestData): string {
  const cacheKey = getCachedImageHash(data);
  return `${extensionConfiguration.cachedImagesPath || ''}/${cacheKey}.png`;
}

// Returns the absolute path to the image on the storage bucket.
export function getCachedImageUrl(data: RequestData): string {
  const path = getCachedImagePath(data);
  return `${firebaseStorageApi}/v0/b/${
    extensionConfiguration.bucket
  }/o/${encodeURIComponent(path)}?alt=media`;
}

// Returns whether a given image is cached.
export async function isImageCached(data: RequestData): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') return false;
  const path = getCachedImagePath(data);
  const file = admin.storage().bucket(extensionConfiguration.bucket).file(path);
  const exists = await file.exists();
  return exists[0];
}

// Caches an image by saving it onto the storage bucket.
export async function cacheImage(
  data: RequestData,
  image: Buffer,
): Promise<void> {
  const path = getCachedImagePath(data);
  const file = admin.storage().bucket(extensionConfiguration.bucket).file(path);

  return file.save(image, {
    contentType: 'image/png',
    metadata: {
      ...data,
    },
    predefinedAcl: 'publicRead',
  });
}

// Returns product data from the provided collections.
export async function fetchProductFromFirestore(
  id: string,
): Promise<Product | null> {
  if (!extensionConfiguration.productsCollection) {
    return null;
  }

  const snapshot = await admin
    .firestore()
    .collection(extensionConfiguration.productsCollection)
    .doc(id)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();
  const schema = extensionConfiguration.productsSchema;

  const name = get(data, schema['name']);
  const imageUrl = get(data, schema['imageUrl']);
  const price = get(data, schema['price']);

  if (!name || !imageUrl || !price) {
    return null;
  }

  return { name, imageUrl, price };
}

// Returns product data from a URL. The URL is expected to be HTML containing a schema script.
export async function fetchProductFromUrl(
  url: string,
): Promise<Product | null> {
  let dom: JSDOM;

  try {
    dom = await JSDOM.fromURL(url, {
      virtualConsole: new VirtualConsole(),
    });
  } catch (e) {
    console.error(e);
    throw e;
  }

  const scripts = dom.window.document.querySelectorAll(
    'script[type="application/ld+json"]',
  );

  let product: ProductSchema;

  for (const script of Array.from(scripts)) {
    try {
      const json = script.textContent;
      const schema = JSON.parse(json);

      if (schema['@type'] === 'Product') {
        product = schema;
        break;
      }
    } catch {}
  }

  // No product found.
  if (product == null) {
    return null;
  }

  const productImage = await fetchProductSchemaImage(product);

  return {
    name: `${product.name}`,
    price: getProductSchemaPrice(product.offers as Offer),
    imageUrl: productImage.dataURI,
  };
}

// Returns a promise that resolves to the image data URI of a given product schema.
export async function fetchProductSchemaImage(
  product: ProductSchema,
): Promise<{ dataURI: string; metadata: Metadata }> {
  let imageUrl;
  if (product.image) {
    if (typeof product.image === 'string') {
      imageUrl = product.image;
    } else if (typeof product.image === 'object') {
      imageUrl = (product.image as ImageObject).contentUrl;
    }
  }

  if (!imageUrl || !imageUrl.length) {
    throw new Error(`No image URL found for product ${product.name}`);
  }

  let productImage = (
    await axios.get(product.image as string, {
      responseType: 'arraybuffer',
    })
  ).data;

  productImage = await sharp(productImage)
    .resize(1920, 1080, {
      fit: 'contain',
      background: 'rgba(0, 0, 0, 0)',
    })
    .toFormat('png')
    .toBuffer();

  const productImageMeta = await sharp(productImage).metadata();

  return {
    dataURI: 'data:image/jpeg;base64,' + productImage.toString('base64'),
    metadata: productImageMeta,
  };
}

export async function generateImageFromProductData(
  theme: RequestData['theme'],
  headline: RequestData['headline'],
  cta: RequestData['cta'],
  product: Product,
): Promise<Buffer> {
  const htmlTemplate = readFileSync(
    path.join(__dirname, '..', 'template.html'),
  ).toString('utf-8');
  const buffer = await nodeHtmlToImage({
    html: htmlTemplate,
    content: {
      headline,
      cta,
      theme,
      isDark: theme === 'dark',
      isLight: theme === 'light',
      productName: product.name,
      productImage: product.imageUrl,
      productPrice: product.price,
    },
    transparent: true,
  });
  return buffer as Buffer;
}

// Returns a formatted price from a given product schema offer.
function getProductSchemaPrice(offer?: Offer): string | null {
  if (!offer) return null;
  if (offer['@type'] === 'Offer') {
    return getProductSchemaCurrencySymbol(offer.priceCurrency) + offer.price;
  }
  if (offer['@type'] === 'AggregateOffer') {
    return (
      getProductSchemaCurrencySymbol(offer.priceCurrency) +
      (offer.price || offer.lowPrice || offer.highPrice)
    );
  }
  return null;
}

// Returns the currency symbol for a given product schema offer.
function getProductSchemaCurrencySymbol(currency: unknown): string {
  switch (currency) {
    case 'EUR':
      return '€';
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    default:
      return '';
  }
}

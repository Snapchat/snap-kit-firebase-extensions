export const extensionConfiguration = {
  bucket: process.env.CLOUD_STORAGE_BUCKET,
  cachedImagesPath: process.env.CACHED_IMAGES_PATH,
  productsCollection: process.env.PRODUCTS_COLLECTION,
  productsSchema: JSON.parse(process.env.PRODUCTS_SCHEMA),
};

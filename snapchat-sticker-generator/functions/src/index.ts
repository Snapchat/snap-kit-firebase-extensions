import * as firebase from 'firebase-admin';
import * as functions from 'firebase-functions';

import * as log from './logs';
import * as utils from './utils';
import * as config from './config';
import { Product } from './utils';

const storageBucket = process.env.FUNCTIONS_EMULATOR
  ? 'gs://default-bucket'
  : config.extensionConfiguration.bucket;

const projectId = process.env.FUNCTIONS_EMULATOR
  ? 'demo-project'
  : process.env.PROJECT_ID;

firebase.initializeApp({
  projectId,
  storageBucket,
});

async function getImage(data: utils.RequestData): Promise<utils.ResponseData> {
  log.start();

  try {
    await utils.schema.isValid(data);
  } catch (error) {
    console.log(error);
    throw error;
  }

  // Check if image is already cached.
  const cachedImageUrl = utils.getCachedImageUrl(data);
  if (await utils.isImageCached(data)) {
    return {
      url: cachedImageUrl,
    };
  }

  let product: Product;

  if (data.url) {
    product = await utils.fetchProductFromUrl(data.url);
    if (product == null) {
      throw new Error(
        `No product schema was found for the requested URL (${data.url})`,
      );
    }
  } else if (data.id) {
    product = await utils.fetchProductFromFirestore(data.id);
    if (product == null) {
      throw new Error(
        `No product schema was found for the requested document (${data.id})`,
      );
    }
  } else {
    throw new Error('No product URL or ID was provided');
  }

  const image = await utils.generateImageFromProductData(
    data.theme,
    data.headline,
    data.cta,
    product,
  );

  await utils.cacheImage(data, image);

  if (process.env.NODE_ENV !== 'production') {
    return { url: cachedImageUrl, product };
  } else {
    return { url: cachedImageUrl };
  }
}

export const createImageHttps = functions.https.onCall(
  async (data, context) => {
    if (!context.auth && !process.env.FUNCTIONS_EMULATOR) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'This function requires authentication.',
      );
    }

    try {
      return await getImage(data);
    } catch (e: unknown) {
      log.logger.error(e);
      throw new functions.https.HttpsError(
        'failed-precondition',
        (e as Error)?.message ?? 'Something went wrong.',
      );
    }
  },
);

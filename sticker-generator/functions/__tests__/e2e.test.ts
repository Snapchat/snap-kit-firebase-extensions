import functions from 'firebase-functions-test';
import * as cloudFunctions from '../src';

const config = {
  projectId: 'demo-project',
  storageBucket: 'gs://default-bucket',
};

const testEnv = functions(config);
const createImageHttps = testEnv.wrap(cloudFunctions.createImageHttps);

function request(url: string) {
  return createImageHttps(
    { url },
    {
      auth: {
        uid: 'test',
        token: 'test',
      },
    },
  );
}

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
// process.env.FIRESTORE_FUNCTIONS_HOST = 'localhost:5001';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

describe('e2e testing', () => {
  test.skip('it errors if a page was request with no product schema', async () => {
    await expect(request('https://www.google.com')).rejects.toThrow(
      /No product schema was found/i,
    );
  });

  test.skip('it errors if the URL does not return a HTML page', async () => {
    // TODO
  });

  describe('Vendors', () => {
    test('Nike', async () => {
      const { product } = await request(
        'https://www.nike.com/gb/t/jordan-delta-2-shoe-tpT0z2/CW0913-005',
      );

      console.log(product);

      expect(product['@type']).toEqual('Product');
      expect(typeof product['image']).toEqual('string');
    }, 20000);

    test('Google', async () => {
      const { product } = await request(
        'https://www.google.com/shopping/product/r/GB/865979822610360489',
      );

      expect(product['@type']).toEqual('Product');
      expect(typeof product['image']).toEqual('string');
    });

    test.skip('Amazon', async () => {
      const { product } = await request(
        'https://www.amazon.co.uk/Google-PIXEL-G013A-64GB-Smartphone/dp/B07P8ZRJ2G',
      );

      expect(product['@type']).toEqual('Product');
      expect(typeof product['image']).toEqual('string');
    });
  });
});

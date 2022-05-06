### See the Extension in Action

See an example of how to [genrate](https://github.com/Snapchat/snap-kit-firebase-extensions/blob/main/sticker-generator/example/index.html) a Snapchat sticker.

### Using this extension

Use https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/ext-${EXT_INSTANCE_ID}-createImageHttps to generate a snapchat sticker.

#### Parameters

Product data can be sourced from the `${param:PRODUCTS_COLLECTION}` collection.

Data input associated with Firestore products uses the followign schema:

```js
${param:PRODUCTS_SCHEMA}
```

Generated stickers will appear in https://console.firebase.google.com/project/${PROJECT_ID}/storage/${param:CLOUD_STORAGE_BUCKET}/files.

The Generate Sticker api accepts the following data parameters:

`Id`: The document id of a product from the products collection.

`Url`: A url of a prdouct that contains product (structured-data)[https://developers.google.com/search/docs/advanced/structured-data/product]

`Theme`: Sets `light` or `dark` mode on the generated images. Defaults to light.

`Headline`: The main headline text to appear on the generated image.

`Cta`: The text to appear on the button/link on the generated image.

Cached images are stored at `${param:CACHED_IMAGES_PATH}`

#### Firestore products example:

```js
const url = `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/ext-${EXT_INSTANCE_ID}-createImageHttps`;

const response = await fetch(url, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + window.tokenResult.token,
  },
  body: JSON.stringify({
    data: {
      id: '', // The Firestore product id.
      theme: 'dark',
      headline: 'My first generated snapchat sticker!',
      cta: 'Click me!',
    },
  }),
});

const json = await response.json();
```

#### Url example:

```js
const url = `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/ext-${EXT_INSTANCE_ID}-createImageHttps`;
const productUrl =
  'https://www.nike.com/gb/t/air-force-1-crater-flyknit-next-nature-shoes-qHncTB/DM0590-001';

const response = await fetch(url, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + window.tokenResult.token,
  },
  body: JSON.stringify({
    data: {
      url: productUrl, // Example Nike Product
      theme: 'dark',
      headline: 'My first generated snapchat sticker!',
      cta: 'Click me!',
    },
  }),
});

const json = await response.json();
```

### Monitoring

As a best practice, you can [monitor](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) the activity of your installed extension, including checks on its health, usage, and logs.

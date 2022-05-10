Use this extension to generate a custom Snapchat Camera sticker (png) and store on a Cloud Storage bucket for the purpose of sharing to Snapchat Stories using [Creative Kit](https://snapkit.com/creative-kit).

Creative Kit allows apps and websites to send content to Snapchat for sharing on Stories, while including a url attachment that helps to grow usage and awareness. This extension makes it easy to generate a sticker that is designed to be overlaid on top of the Snapchat camera ([SCSDKNoSnapContent](https://docs.snap.com/snap-kit/creative-kit/Tutorials/ios#creating-on-top-of-photos-or-videos-taken-in-snapchat)).

When calling the Snapchat sticker api, this extension:

- Generates a new transparent png image to specification for sharing over Snapchat Camera with Creative Kit and Creative Kit Web
- Customizes the image content based on the url and product schema or a provided url
- Alternatively, customizes the image content based on the product and schema collection data of a Firestore product

Generated images can be cached by providing a path to store cached images.

#### Detailed configuration information

To configure this extension, specify a Cloud Storage bucket to store the generated images.

`Product` and `Schema` collections are optional and can be configured to allow stickers to be generated based on your own products.

Caching is an optional path for storing a generated image and is recommended for better performance.

#### Additional setup

Before installing this extension, make sure that you've [set up a Cloud Storage bucket](https://firebase.google.com/docs/storage) in your Firebase project.

In the [Snap Kit Developer Portal](https://kit.snapchat.com/manage/) you’ll need to create an account and register your app and/or website to enable sharing to Snapchat via Creative Kit. See docs here: [Getting Started](https://docs.snap.com/snap-kit/developer-portal/developing-your-app) and [Creative Kit](https://docs.snap.com/snap-kit/creative-kit/overview#features).

#### Billing

To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- Cloud Firestore
- Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))
- Cloud Storage

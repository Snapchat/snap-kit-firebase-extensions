# Snapchat Sticker Generator

**Author**: Invertase (**[https://invertase.io](https://invertase.io)**)

**Description**: Generate custom snapchat stickers based on product metadata.

**Details**: Use this extension to generate a custom Snapchat Camera sticker (png) and store on a Cloud Storage bucket for the purpose of sharing to Snapchat Stories using [Creative Kit](https://snapkit.com/creative-kit).

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

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
- Cloud Storage
- Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))

**Configuration Parameters:**

- Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your Storage bucket. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

- Cloud Storage bucket for images: The Cloud Storage bucket where images that are to be processed are located. API requests with input urls or paths that are not inside this bucket will be dropped.

- Cloud Storage path where processed images will be cached.: A relative path in which to store cached images. For example, `cache`. If you prefer to store resized images at the default location, leave this field empty.

- Products and pricing plans collection: What is the path to the Cloud Firestore collection where your products are located. Product IDs can  be used instead of a url when calling the function endpoint, if this collection value is set.

- Product Schema: A schema mapping Firestore document data to a product object. The schema can be used to access deeply nested values in the document via dot-notation, for example "pricing.value" would access the "value" property within the "pricing" map.

**Cloud Functions:**

- **createImageHttps:** Generate a Snapchat sticker through a http post request.

**APIs Used**:

- storage-component.googleapis.com (Reason: Needed to use Cloud Storage)

**Access Required**:

This extension will operate with the following project IAM roles:

- storage.admin (Reason: Allows the extension to store resized images in Cloud Storage)

- datastore.user (Reason: Allows this extension to access Cloud Firestore to read and process added product documents.)

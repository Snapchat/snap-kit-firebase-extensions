<!-- 
This file provides your users an overview of your extension. All content is optional, but this is the recommended format. Your users will see the contents of this file when they run the `firebase ext:info` command.

Include any important functional details as well as a brief description for any additional setup required by the user (both pre- and post-installation).

Learn more about writing a PREINSTALL.md file in the docs:
https://firebase.google.com/docs/extensions/alpha/create-user-docs#writing-preinstall
-->

Use this extension to allow your community of users to authenticate with Firebase using their Snapchat accounts. Snapchat has a massive reach, with millions of people using the app daily. Logging in via Snapchat allows you to tap into this audience, providing a quick and easy way for your users to sign up, log in, and avoid any obstacles. 

# Recommended Usage

This extension is meant to allow users to authenticate with Firebase using Snapchat as the identity provider. If you do not intend to use Firebase authentication, but still want to use Snapchat as an identity provider, please use [Snap Kit’s Login Kit](https://kit.snapchat.com/docs/login-kit).

# Additional setup

To get started, there are a few steps you will need to follow in order to set up, install, and integrate with this extension. This process is described in detail on our website. Please see [Snap Kit iOS Login Kit Firebase Extension Setup](https://docs.snap.com/snap-kit/login-kit/Tutorials/firebase/ios) or [Snap Kit Android Login Kit Firebase Extension Setup](https://docs.snap.com/snap-kit/login-kit/Tutorials/firebase/android) for more information.


<!-- We recommend keeping the following section to explain how billing for Firebase Extensions works -->
# Billing

This extension uses other Firebase or Google Cloud Platform services which may have associated charges:

<!-- List all products the extension interacts with -->
- Cloud Functions
- Firebase Authentication
- Secret Manager

This extension also uses the following third-party services:

- Snap Login Kit ([pricing information](https://kit.snapchat.com/login-kit))

You are responsible for any costs associated with your use of these services.

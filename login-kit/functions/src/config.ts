/**
 * Copyright 2021 Snap, Inc.
 */

export default {
  appId: process.env.APP_ID,
  confidentialOAuthClientId: process.env.CONFIDENTIAL_OAUTH_CLIENT_ID,
  signingServiceAcocunt: process.env.SIGNING_SERVICE_ACCOUNT,
  handleSnapchatUserDeletion: process.env.HANDLE_SNAPCHAT_USER_DELETION,

  authServiceUrl: "https://accounts.snapchat.com",
  accessTokenEndpointPath: "accounts/oauth2/token",

  canvasApiUrl: "https://graph.snapchat.com",
  canvasApiEndpointPath: "graphql",
  jwksEndpointPath: ".well-known/jwks.json",
};

/**
 * Copyright 2021 Snap, Inc.
 */

export default {
  appId: String(process.env.APP_ID),
  confidentialOAuthClientId: String(process.env.CONFIDENTIAL_OAUTH_CLIENT_ID),
  signingServiceAcocunt: String(process.env.SIGNING_SERVICE_ACCOUNT),
  handleSnapchatUserDeletion: process.env.HANDLE_SNAPCHAT_USER_DELETION === "true",

  authServiceUrl: "https://accounts.snapchat.com",
  accessTokenEndpointPath: "accounts/oauth2/token",

  canvasApiUrl: "https://graph.snapchat.com",
  canvasApiEndpointPath: "graphql",
  jwksEndpointPath: ".well-known/jwks.json",
};

/**
 * Copyright 2021 Snap, Inc.
 */

export default {
  clientId: process.env.CLIENT_ID,
  signingServiceAcocunt: process.env.SIGNING_SERVICE_ACCOUNT,

  authServiceUrl: "https://accounts.snapchat.com",
  accessTokenEndpointPath: "accounts/oauth2/token",

  canvasApiUrl: "https://graph.snapchat.com",
  canvasApiEndpointPath: "graphql",
};
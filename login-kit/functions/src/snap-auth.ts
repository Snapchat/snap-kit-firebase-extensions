/**
 * Copyright 2021 Snap, Inc.
 */

import axios from "axios";
import {JWK, JWKS, JWT} from "jose";

import * as config from "./config";
import {
  constructAccessTokenErrorResponse,
  constructAccessTokenResponse,
  AccessTokenParams,
  FetchAccessTokenResponse,
} from "./interfaces";
import * as log from "./logs";

export const fetchAccessToken = (
    accessTokenParams: AccessTokenParams, clientSecret: string): Promise<FetchAccessTokenResponse> => {
  const formData = new URLSearchParams();
  formData.append("grant_type", "authorization_code");
  formData.append("code", accessTokenParams.code);
  formData.append("redirect_uri", accessTokenParams.redirectUri);
  formData.append("code_verifier", accessTokenParams.codeVerifier);

  const unencodedAuthorizationHeader = `${config.default.confidentialOAuthClientId}:${clientSecret}`;
  const authorizationHeader = Buffer.from(unencodedAuthorizationHeader).toString("base64");

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Authorization": `Basic ${authorizationHeader}`,
  };

  const accessTokenEndpointUrl = `${config.default.authServiceUrl}/${config.default.accessTokenEndpointPath}`;

  return axios
      .post(accessTokenEndpointUrl, formData, {headers})
      .then((resp) => {
        if (resp.status != 200) {
          return constructAccessTokenErrorResponse(resp.status, resp.data.error, resp.data.error_description);
        }

        return constructAccessTokenResponse(resp.data.access_token, resp.data.token_type, resp.data.expires_in,
            resp.data.refresh_token, resp.data.scope);
      })
      .catch((error) => {
        log.logError("error fetching access token", error);
        return constructAccessTokenErrorResponse(error.response.status, error.response.data.error,
            error.response.data.error_description);
      });
};

const ISS_SNAPCHAT = "Snapchat";

export const verifyWebhookAuthToken = (
    authToken: string,
    publicJWKS: JWK.ECKey[],
    expectedAudience: string,
    ignoreTokenExpiry=false): boolean => {
  if (!authToken) {
    log.logInfo("Authorization token missing");
    return false;
  }

  const keyStore = new JWKS.KeyStore(publicJWKS);

  try {
    JWT.verify(authToken, keyStore, {
      issuer: ISS_SNAPCHAT,
      audience: expectedAudience,
      now: new Date(),
      ignoreIat: true,
      ignoreExp: ignoreTokenExpiry,
    });
    return true;
  } catch (error) {
    log.logError("error verifying token", error);
    return false;
  }
};

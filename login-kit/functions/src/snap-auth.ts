/**
 * Copyright 2021 Snap, Inc.
 */

import axios from "axios";

import * as config from "./config";
import {
  AccessTokenParams,
  FetchAccessTokenResponse,
  constructAccessTokenErrorResponse,
  constructAccessTokenResponse,
} from "./interfaces";
import * as log from "./logs";

export const fetchAccessToken = (
    accessTokenParams:AccessTokenParams, clientSecret: string): Promise<FetchAccessTokenResponse> => {
  const formData = new URLSearchParams();
  formData.append("grant_type", "authorization_code");
  formData.append("code", accessTokenParams.code);
  formData.append("redirect_uri", accessTokenParams.redirectUri);
  formData.append("code_verifier", accessTokenParams.codeVerifier);

  const unencodedAuthorizationHeader = `${config.default.clientId}:${clientSecret}`;
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

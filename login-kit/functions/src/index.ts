/**
 * Copyright 2021 Snap, Inc.
 */

import * as functions from "firebase-functions";

import {AccessTokenParams, FetchAccessTokenResponse} from "./interfaces";
import {fetchAccessToken} from "./snap-auth";

enum ContentType {
  ApplicationJson = "application/json;charset=UTF-8",
  FormUrlEncoded = "application/x-www-form-urlencoded",
}

enum Errors {
  InvalidPayload = "invalid_payload",
  MissingConfig = "missing_config",
  Unexpected = "unxpected",
}

const ERROR_DESCRIPTIONS = {
  invalidArguments: "invalid argument",
  unsupportedContentType: "unsupported Content-Type",
  codeMissing: "code missing",
  codeVerifierMissing: "codeVerifier missing",
  redirectUriMissing: "redirectUri missing",

  clientSecretMissing: "snap.snapchatlogin.client_secret environment configuration missing",
  unexpectedResponseType: "unexpected response type",
};

exports.getSnapAccessToken = functions.handler.https.onRequest(
    async (req:functions.Request, res:functions.Response) => {
      let accessTokenParams: AccessTokenParams;
      try {
        accessTokenParams = constructAccessTokenParams(req);
      } catch (error) {
        if (error instanceof TypeError) {
          res.status(400).send({
            error: Errors.InvalidPayload,
            errorDescription: error.message,
          });
        } else {
          res.status(500).send({
            error: Errors.Unexpected,
            errorDescription: "unknown error constructing access token params",
          });
        }
        return;
      }

      const clientSecret = functions.config().snap.snapchatlogin.client_secret;
      if (!clientSecret) {
        res.status(400).send({
          error: Errors.MissingConfig,
          errorDescription: ERROR_DESCRIPTIONS.clientSecretMissing,
        });
        return;
      }

      const fetchAccessTokenResponse: FetchAccessTokenResponse =
          await fetchAccessToken(accessTokenParams, clientSecret);
      switch (fetchAccessTokenResponse.kind) {
        case "AccessTokenResponse":
          res.status(200).send({
            accessToken: fetchAccessTokenResponse.accessToken,
            tokenType: fetchAccessTokenResponse.tokenType,
            expiresIn: fetchAccessTokenResponse.expiresIn,
            scope: fetchAccessTokenResponse.scope,
          });
          break;
        case "AccessTokenErrorResponse":
          res.status(fetchAccessTokenResponse.status).send({
            error: fetchAccessTokenResponse.error,
            errorDescription: fetchAccessTokenResponse.errorDescription,
          });
          break;
        default:
          res.status(500).send({
            error: Errors.Unexpected,
            errorDescription: ERROR_DESCRIPTIONS.unexpectedResponseType,
          });
          break;
      }

      return;
    }
);

/**
 * Parses access token params from a request.
 * @param {functions.Request} req - the request to parse access token params from
 * @return {AccessTokenParams} parsed access token params
 */
function constructAccessTokenParams(req: functions.Request): AccessTokenParams {
  let code: string;
  let codeVerifier: string;
  let redirectUri: string;

  const requestContentType = req.get("Content-Type");
  switch (requestContentType) {
    case ContentType.ApplicationJson:
      ({code, codeVerifier, redirectUri} = req.body);
      break;
    case ContentType.FormUrlEncoded:
      ({code, codeVerifier, redirectUri} = req.body);
      break;
    default:
      throw new TypeError(ERROR_DESCRIPTIONS.unsupportedContentType);
  }

  code = code ? code.trim() : "";
  codeVerifier = codeVerifier ? codeVerifier.trim() : "";
  redirectUri = redirectUri ? redirectUri.trim() : "";

  if (code.length <= 0) {
    throw new TypeError(ERROR_DESCRIPTIONS.codeMissing);
  }

  if (codeVerifier.length <= 0) {
    throw new TypeError(ERROR_DESCRIPTIONS.codeVerifierMissing);
  }

  if (redirectUri.length <= 0) {
    throw new TypeError(ERROR_DESCRIPTIONS.redirectUriMissing);
  }

  const accessTokenParams = {code, codeVerifier, redirectUri} as AccessTokenParams;
  return accessTokenParams;
}

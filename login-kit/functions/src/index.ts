/**
 * Copyright 2021 Snap, Inc.
 */

import base64url from "base64url";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import {fetchExternalId} from "./canvas-api";
import {AccessTokenParams, FetchAccessTokenResponse, Kind, MeResponse} from "./interfaces";
import * as log from "./logs";
import {fetchAccessToken} from "./snap-auth";

enum ContentType {
  ApplicationJson = "application/json;charset=UTF-8",
  FormUrlEncoded = "application/x-www-form-urlencoded",
}

enum Errors {
  InvalidPayload = "invalid_payload",
  MissingConfig = "missing_config",
  Unexpected = "unexpected",
}

const ERROR_DESCRIPTIONS = {
  invalidArguments: "invalid argument",
  unsupportedContentType: "unsupported Content-Type",
  codeMissing: "code missing",
  codeVerifierMissing: "codeVerifier missing",
  redirectUriMissing: "redirectUri missing",

  accessTokenMissing: "accessToken missing",

  clientSecretMissing: "snap.snapchatlogin.client_secret environment configuration missing",
  unexpectedResponseType: "unexpected response type",

  customTokenCreationFailure: "failed to create a custom token",
};

exports.getCustomToken = functions.handler.https.onRequest(
    async (req:functions.Request, res:functions.Response) => {
      let accessToken: string;
      try {
        accessToken = extractAccessToken(req);
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

      const meResponse:MeResponse = await fetchExternalId(accessToken);
      switch (meResponse.kind) {
        case Kind.Me: {
          // Snapchat external user ID is base64 encoded, and Firebase requires user IDs to be
          // URL-safe. Converting to base64 URL encoding.
          const externalIdBase64Url = base64url.fromBase64(meResponse.externalID);
          admin.auth()
              .createCustomToken(externalIdBase64Url, {})
              .then((customToken) => {
                res.status(200).send({customToken});
              })
              .catch((error) => {
                log.logError("Custom token creation failure", error);
                res.status(500).send({
                  error: Errors.Unexpected,
                  errorDescription: ERROR_DESCRIPTIONS.customTokenCreationFailure,
                });
              });
          break;
        }
        case Kind.MeError: {
          res.status(500).send({
            error: meResponse.code,
            errorDescription: meResponse.message,
          });
          break;
        }
        default: {
          res.status(500).send({
            error: Errors.Unexpected,
            errorDescription: ERROR_DESCRIPTIONS.unexpectedResponseType,
          });
          break;
        }
      }

      return;
    }
);

exports.getSnapAccessToken = functions.handler.https.onRequest(
    async (req:functions.Request, res:functions.Response) => {
      let accessTokenParams: AccessTokenParams;
      try {
        accessTokenParams = constructAccessTokenParams(req);
      } catch (error) {
        if (error instanceof TypeError) {
          sendJSONResponse(res, 400, {
            error: Errors.InvalidPayload,
            errorDescription: error.message,
          });
        } else {
          sendJSONResponse(res, 500, {
            error: Errors.Unexpected,
            errorDescription: "unknown error constructing access token params",
          });
        }
        return;
      }

      const clientSecret = functions.config().snap.snapchatlogin.client_secret;
      if (!clientSecret) {
        log.logInfo("clientSecret not found. run the following command to set the secret: " +
            "firebase functions:config:set snap.snapchatlogin.client_secret=\"<client_secret>\"" +
            "--project=<firebase_project>");
        sendJSONResponse(res, 400, {
          error: Errors.MissingConfig,
          errorDescription: ERROR_DESCRIPTIONS.clientSecretMissing,
        });
        return;
      }

      const fetchAccessTokenResponse: FetchAccessTokenResponse =
          await fetchAccessToken(accessTokenParams, clientSecret);

      switch (fetchAccessTokenResponse.kind) {
        case Kind.AccessTokenResponse:
          sendJSONResponse(res, 200, {
            accessToken: fetchAccessTokenResponse.accessToken,
            tokenType: fetchAccessTokenResponse.tokenType,
            expiresIn: fetchAccessTokenResponse.expiresIn,
            scope: fetchAccessTokenResponse.scope,
          });
          break;
        case Kind.AccessTokenErrorResponse:
          sendJSONResponse(res, fetchAccessTokenResponse.status, {
            error: fetchAccessTokenResponse.error,
            errorDescription: fetchAccessTokenResponse.errorDescription,
          });
          break;
        default:
          sendJSONResponse(res, 500, {
            error: Errors.Unexpected,
            errorDescription: ERROR_DESCRIPTIONS.unexpectedResponseType,
          });
          break;
      }

      return;
    }
);

/**
 * Extracts access token from a request.
 * @param {functions.Request} req - the request to parse custom token params from
 * @return {AccessTokenParams} parsed custom token params
 */
function extractAccessToken(req: functions.Request): string {
  let accessToken: string;

  const requestContentType = req.get("Content-Type");
  switch (requestContentType) {
    case ContentType.ApplicationJson:
      ({accessToken} = req.body);
      break;
    case ContentType.FormUrlEncoded:
      ({accessToken} = req.body);
      break;
    default:
      throw new TypeError(ERROR_DESCRIPTIONS.unsupportedContentType);
  }

  accessToken = accessToken ? accessToken.trim() : "";
  if (accessToken.length <= 0) {
    throw new TypeError(ERROR_DESCRIPTIONS.accessTokenMissing);
  }

  return accessToken;
}

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
      log.logInfo("unsupported Content-Type " + requestContentType);
      throw new TypeError(ERROR_DESCRIPTIONS.unsupportedContentType);
  }

  code = code ? code.trim() : "";
  codeVerifier = codeVerifier ? codeVerifier.trim() : "";
  redirectUri = redirectUri ? redirectUri.trim() : "";

  if (code.length <= 0) {
    log.logInfo("missing code in request payload");
    throw new TypeError(ERROR_DESCRIPTIONS.codeMissing);
  }

  if (codeVerifier.length <= 0) {
    log.logInfo("missing codeVerifier in request payload");
    throw new TypeError(ERROR_DESCRIPTIONS.codeVerifierMissing);
  }

  if (redirectUri.length <= 0) {
    log.logInfo("missing redirectUri in request payload");
    throw new TypeError(ERROR_DESCRIPTIONS.redirectUriMissing);
  }

  const accessTokenParams = {code, codeVerifier, redirectUri} as AccessTokenParams;
  return accessTokenParams;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Sends a JSON response
 * @param {functions.Response} res
 * @param {number} status
 * @param {any} paylod
 */
function sendJSONResponse(res: functions.Response, status:number, paylod: any): void {
  res.status(status).contentType(ContentType.ApplicationJson).send(paylod);
}

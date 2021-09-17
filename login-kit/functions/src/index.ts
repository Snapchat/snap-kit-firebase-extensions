/**
 * Copyright 2021 Snap, Inc.
 */

import base64url from "base64url";
import * as contentType from "content-type";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as NodeCache from "node-cache";
import {SecretManagerServiceClient} from "@google-cloud/secret-manager";

import {fetchExternalId, fetchJwks} from "./canvas-api";
import * as config from "./config";
import {
  AccessTokenParams,
  FetchAccessTokenResponse,
  FetchJWKResponse,
  Kind,
  MeResponse,
  WebhookObject,
} from "./interfaces";
import * as log from "./logs";
import {extractKidFromWebhookAuthToken, fetchAccessToken, verifyWebhookAuthToken} from "./snap-auth";

const CACHE = new NodeCache();

enum ContentType {
  ApplicationJson = "application/json",
  TextPlain = "text/plain",
}

enum ContentTypeParam {
  Charset = "charset",
}

enum ContentTypeParamValue {
  CharsetUTF8 = "utf-8",
}

enum Errors {
  InvalidPayload = "invalid_payload",
  MissingConfig = "missing_config",
  Unauthorized = "unauthorized",
  Unexpected = "unexpected",
}

const ERROR_DESCRIPTIONS = {
  invalidArguments: "invalid argument",
  unsupportedContentType: "unsupported Content-Type",
  codeMissing: "code missing",
  codeVerifierMissing: "codeVerifier missing",
  redirectUriMissing: "redirectUri missing",

  clientSecretMissing: "snap.snapchatlogin.client_secret environment configuration missing",

  unexpectedStatus: "unexpected status",
  unexpectedResponseType: "unexpected response type",

  customTokenCreationFailure: "failed to create a custom token",
};

admin.initializeApp({
  serviceAccountId: config.default.signingServiceAcocunt,
});

exports.getCustomToken = functions.handler.https.onRequest(
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

      let clientSecret: string;
      try {
        clientSecret = await getClientSecret(config.default.oauthClientSecret);
      } catch (error) {
        log.logError("error reading client secret", error);
        sendJSONResponse(res, 500, {
          error: Errors.Unexpected,
          errorDescription: errorDescription(error, "unknown error reading client secret"),
        });
        return;
      }

      const fetchAccessTokenResponse: FetchAccessTokenResponse =
          await fetchAccessToken(accessTokenParams, clientSecret);

      let accessToken: string;
      switch (fetchAccessTokenResponse.kind) {
        case Kind.AccessTokenResponse:
          accessToken = fetchAccessTokenResponse.accessToken;
          break;
        case Kind.AccessTokenErrorResponse:
          sendJSONResponse(res, fetchAccessTokenResponse.status, {
            error: fetchAccessTokenResponse.error,
            errorDescription: fetchAccessTokenResponse.errorDescription,
          });
          return;
        default:
          sendJSONResponse(res, 500, {
            error: Errors.Unexpected,
            errorDescription: ERROR_DESCRIPTIONS.unexpectedResponseType,
          });
          return;
      }

      const meResponse:MeResponse = await fetchExternalId(accessToken);
      switch (meResponse.kind) {
        case Kind.Me: {
          // Snapchat external user ID is base64 encoded, and Firebase requires user IDs to be
          // URL-safe. Converting to base64 URL encoding.
          const externalIdBase64Url = base64url.fromBase64(meResponse.externalId);
          admin.auth()
              .createCustomToken(externalIdBase64Url, {})
              .then((customToken) => {
                sendPlaintextResponse(res, 200, customToken);
              })
              .catch((error) => {
                log.logError("Custom token creation failure", error);
                sendJSONResponse(res, 500, {
                  error: Errors.Unexpected,
                  errorDescription: ERROR_DESCRIPTIONS.customTokenCreationFailure,
                });
              });
          break;
        }
        case Kind.MeError: {
          if (meResponse.status == 200) {
            sendJSONResponse(res, 500, {
              error: meResponse.code,
              errorDescription: meResponse.message,
            });
          } else {
            sendJSONResponse(res, 500, {
              error: Errors.Unexpected,
              errorDescription: ERROR_DESCRIPTIONS.unexpectedStatus,
            });
          }
          break;
        }
        default: {
          sendJSONResponse(res, 500, {
            error: Errors.Unexpected,
            errorDescription: ERROR_DESCRIPTIONS.unexpectedResponseType,
          });
          break;
        }
      }

      return;
    }
);

const CLIENT_SECRET_KEY = "snap.snaplogin.clientsecret";
const CLIENT_SECRET_CACHE_TTL_SECS = 600;

const SECRET_MANAGER_SERVICE_CLIENT = new SecretManagerServiceClient();

const getClientSecret = (secretName: string): Promise<string> => {
  if (CACHE.has(CLIENT_SECRET_KEY)) {
    const clientSecret = CACHE.get<string>(CLIENT_SECRET_KEY);
    if (clientSecret) {
      return Promise.resolve(clientSecret);
    }
  }

  return SECRET_MANAGER_SERVICE_CLIENT
      .accessSecretVersion({name: secretName})
      .then(([secretResponse]) => {
        if (!secretResponse.payload || !secretResponse.payload.data) {
          throw new Error("failed to read client secret payload");
        }

        const clientSecret = secretResponse.payload.data.toString();

        CACHE.set(CLIENT_SECRET_KEY, clientSecret, CLIENT_SECRET_CACHE_TTL_SECS);

        return clientSecret;
      });
};

enum ObjectType {
  SnapchatUser = "snapchat_user",
}

enum UpdateField {
  AccountStatus = "account_status",
}

const BEARER_TYPE = "Bearer";
const BEARER_LENGTH = 6;

exports.updateUser = functions.handler.https.onRequest(
    async (req:functions.Request, res:functions.Response) => {
      if (!config.default.handleSnapchatUserDeletion) {
        res.sendStatus(200);
        log.logInfo("user not deleted!");
        return;
      }

      const authHeader = req.get("Authorization");
      if (!authHeader) {
        log.logInfo("Authorization header missing");
        sendJSONResponse(res, 401, {
          error: Errors.Unauthorized,
          errorDescription: "Authorization header missing",
        });
        return;
      }

      if (!authHeader.startsWith(BEARER_TYPE)) {
        log.logInfo("auth token is not Bearer type");
        sendJSONResponse(res, 401, {
          error: Errors.Unauthorized,
          errorDescription: "invalid auth token type",
        });
        return;
      }

      const token = authHeader.substr(BEARER_LENGTH).trim();
      const kid = extractKidFromWebhookAuthToken(token);
      if (kid == null || kid.length == 0) {
        sendJSONResponse(res, 401, {
          error: Errors.Unauthorized,
          errorDescription: "mal-formatted authotken",
        });
        return;
      }

      const jwksResponse: FetchJWKResponse = await fetchJwks(kid);
      if (jwksResponse.kind == Kind.JWKError) {
        sendJSONResponse(res, 401, {
          error: Errors.Unauthorized,
          errorDescription: "error fetching public JWKS",
        });
        return;
      }

      if (!verifyWebhookAuthToken(token, jwksResponse.keys, config.default.appId)) {
        sendJSONResponse(res, 401, {
          error: Errors.Unauthorized,
          errorDescription: "invalid auth token",
        });
        return;
      }

      if (req.get("Content-Type") !== ContentType.ApplicationJson) {
        sendJSONResponse(res, 400, {
          error: Errors.InvalidPayload,
          errorDescription: ERROR_DESCRIPTIONS.unsupportedContentType,
        });
        return;
      }

      switch (req.body.objectType) {
        case ObjectType.SnapchatUser:
          handleSnapchatUserUpdate(req.body.object)
              .then(() => {
                res.sendStatus(200);
              })
              .catch((error) => {
                log.logError("error handling Snapchat user update", error);
                res.sendStatus(500);
              });
          break;
        default:
          res.sendStatus(200);
          break;
      }
    }
);

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const handleSnapchatUserUpdate = (object: WebhookObject): Promise<void> => {
  if (object.objectType != "snapchat_user") {
    return Promise.resolve();
  }

  const externalIdBase64Url = base64url.fromBase64(object.id);

  for (let i = 0; i < object.updates.length; i++) {
    switch (object.updates[i].field) {
      case UpdateField.AccountStatus:
        if (object.updates[i].value.verb === "deleted") {
          return admin
              .auth()
              .deleteUser(externalIdBase64Url);
        }
        return Promise.resolve();
      default:
        break;
    }
  }

  return Promise.resolve();
};

const errorDescription = (error: unknown, fallbackDescription: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackDescription;
};

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
  if (!requestContentType) {
    log.logInfo("Content-Type header missing");
    throw new TypeError(ERROR_DESCRIPTIONS.unsupportedContentType);
  }

  const contentTypeObj = contentType.parse(requestContentType);
  switch (contentTypeObj.type) {
    case ContentType.ApplicationJson:
      if (contentTypeObj.parameters[ContentTypeParam.Charset].toLowerCase() !== ContentTypeParamValue.CharsetUTF8) {
        log.logInfo("unsupported Content-Type " + requestContentType);
        throw new TypeError(ERROR_DESCRIPTIONS.unsupportedContentType);
      }
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

/* eslint-disable  @typescript-eslint/no-explicit-any */

/**
* Sends a JSON response
* @param {functions.Response} res
* @param {number} status
* @param {any} payload
*/
function sendJSONResponse(res: functions.Response, status:number, payload: any): void {
  const contentTypeStr = contentType.format({
    type: ContentType.ApplicationJson,
    parameters: {charset: ContentTypeParamValue.CharsetUTF8},
  });
  res.status(status).contentType(contentTypeStr).send(payload);
}

/**
* Sends a plaintext response
* @param {functions.Response} res
* @param {number} status
* @param {any} payload
*/
function sendPlaintextResponse(res: functions.Response, status:number, payload: any): void {
  const contentTypeStr = contentType.format({
    type: ContentType.TextPlain,
    parameters: {charset: ContentTypeParamValue.CharsetUTF8},
  });
  res.status(status).contentType(contentTypeStr).send(payload);
}

/* eslint-enable */

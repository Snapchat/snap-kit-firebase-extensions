/**
 * Copyright 2021 Snap, Inc.
 */

 import * as functions from 'firebase-functions';
 
 import { AccessTokenParams } from './interfaces';
 import { fetchAccessToken } from './snap-auth';
 
 const ERRORS = {
    invalidPayload: "invalid_payload",
    missingConfig: "missing_config",
    unexpected: "unxpected"
}
 
 const ERROR_DESCRIPTIONS = {
    invalidArguments: 'invalid argument',
    unsupportedContentType: 'unsupported Content-Type',
    codeMissing: "code missing",
    codeVerifierMissing: "codeVerifier missing",
    redirectUriMissing: "redirectUri missing",
 
    clientSecretMissing: "snap.snapchatlogin.client_secret environment configuration missing",
    unexpectedResponseType: "unexpected response type"
}

exports.getSnapAccessToken = functions.handler.https.onRequest(async (req, res) => {
    let accessTokenParams: AccessTokenParams
    try {
        accessTokenParams = constructAccessTokenParams(req)
    } catch (error) {
        if (error instanceof TypeError) {
            res.status(400).send({
                error: ERRORS.invalidPayload,
                errorDescription: error.message
            })
            return
        } else {
            res.status(500).send({
                error: ERRORS.unexpected,
                errorDescription: "unknown error constructing access token params"
            })
            return
        }
    }

    const clientSecret = functions.config()["snap"]["snapchatlogin"]["client_secret"];
    if (!clientSecret) {
        res.status(400).send({
            error: ERRORS.missingConfig,
            errorDescription: ERROR_DESCRIPTIONS.clientSecretMissing
        })
        return;
    }

    const fetchAccessTokenResponse: any = await fetchAccessToken(accessTokenParams, clientSecret)
    switch (fetchAccessTokenResponse.kind) {
        case "AccessTokenResponse":
            res.status(200).send({
                accessToken: fetchAccessTokenResponse.accessToken,
                tokenType: fetchAccessTokenResponse.tokenType,
                expiresIn: fetchAccessTokenResponse.expiresIn,
                scope: fetchAccessTokenResponse.scope
            })
            break;
        case "AccessTokenErrorResponse": 
            res.status(fetchAccessTokenResponse.status).send({
                error: fetchAccessTokenResponse.error,
                errorDescription: fetchAccessTokenResponse.errorDescription
            })
            break;
        default:
            res.status(500).send({
                error: ERRORS.unexpected,
                errorDescription: ERROR_DESCRIPTIONS.unexpectedResponseType
            })
            break;
    }

    return;
});

function constructAccessTokenParams(req: functions.Request): AccessTokenParams {
    let code: string;
    let codeVerifier: string;
    let redirectUri: string;
    
    switch (req.get('Content-Type')) {
        case 'application/json;charset=UTF-8':
            ({code, codeVerifier, redirectUri} = req.body)
            break;
        case 'application/x-www-form-urlencoded':
            ({code, codeVerifier, redirectUri} = req.body)
            break;
        default:
            throw new TypeError(ERROR_DESCRIPTIONS.unsupportedContentType);
    }

    code = code ? code.trim() : ""
    codeVerifier = codeVerifier ? codeVerifier.trim() : ""
    redirectUri = redirectUri ? redirectUri.trim() : ""

    if (code.length <= 0) {
        throw new TypeError(ERROR_DESCRIPTIONS.codeMissing)
    }

    if (codeVerifier.length <= 0) {
        throw new TypeError(ERROR_DESCRIPTIONS.codeVerifierMissing)
    }

    if (redirectUri.length <= 0) {
        throw new TypeError(ERROR_DESCRIPTIONS.redirectUriMissing)
    }

    const accessTokenParams = {
        code: code,
        codeVerifier: codeVerifier,
        redirectUri: redirectUri
    } as AccessTokenParams

    return accessTokenParams;
}

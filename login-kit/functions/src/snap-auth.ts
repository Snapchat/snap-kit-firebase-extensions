/**
 * Copyright 2021 Snap, Inc.
 */

import axios from 'axios';
import * as FormData from 'form-data';

import * as config from "./config";
import { AccessTokenErrorResponse, AccessTokenParams, AccessTokenResponse } from "./interfaces";

export const fetchAccessToken = (accessTokenParams:AccessTokenParams, clientSecret: string): Promise<any> => {
    let formData = new FormData();
    formData.append("client_id", config.default.clientId);
    formData.append("grant_type", "authorization_code");
    formData.append("code", accessTokenParams.code);
    formData.append("redirect_uri", accessTokenParams.redirectUri);
    formData.append("code_verifier", accessTokenParams.codeVerifier);

    let authorizationHeader = btoa(config.default.clientId + ":" + clientSecret)

    let headers = {
        "Content-Type": "application/json;charset=UTF-8",
        "Cache-Control": "no-store",
        "Pragma": "no-cache",
        "Authorization": authorizationHeader
    };

    let accessTokenEndpointUrl = `${config.default.authServiceUrl}/${config.default.accessTokenEndpointPath}`;

    return axios
        .post(accessTokenEndpointUrl, formData, { headers: headers})
        .then(resp => {
            if (resp.status != 200) {
                return {
                    status: resp.status,
                    error: resp.data.error,
                    errorDescription: resp.data.error_description,
                } as AccessTokenErrorResponse;
            }

            return {
                accessToken: resp.data.access_token,
                tokenType: resp.data.token_type,
                expiresIn: resp.data.expires_in,
                refreshToken: resp.data.refresh_token,
                scope: resp.data.scope
            } as AccessTokenResponse;
        });
}

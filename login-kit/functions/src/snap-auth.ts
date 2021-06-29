/**
 * Copyright 2021 Snap, Inc.
 */

import axios from 'axios';
import FormData from 'form-data';

import * as config from "./config";
import { AccessTokenParams } from "./interfaces";

export const fetchAccessToken = (accessTokenParams:AccessTokenParams): Promise<any> => {
    let formData = new FormData();
    formData.append("client_id", "client_id");
    formData.append("grant_type", "authorization_code");
    formData.append("code", accessTokenParams.code);
    formData.append("redirect_uri", accessTokenParams.redirectUri);
    formData.append("code_verifier", accessTokenParams.codeVerifier);

    let headers = {
        "Content-Type": "application/json;charset=UTF-8",
        "Cache-Control": "no-store",
        "Pragma": "no-cache"
    };

    let accessTokenEndpointUrl = `${config.default.authServiceUrl}/${config.default.accessTokenEndpointPath}`;
    return axios
        .post(accessTokenEndpointUrl, formData, { headers: headers});
}

enum AccessTokenErrorCode {
    
}

class AccessTokenError extends Error {
    code: AccessTokenErrorCode;

    constructor(code: AccessTokenErrorCode, message?: string) {
        super(message);
        code = code;
    }
}
/**
 * Copyright 2021 Snap, Inc.
 */

export interface AccessTokenParams {
    kind: "AccessTokenParams";
    code: string;
    codeVerifier: string;
    redirectUri: string;
}

export interface AccessTokenResponse {
    kind: "AccessTokenResponse";
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    refreshToken: string;
    scope: string;
}

export interface AccessTokenErrorResponse {
    kind: "AccessTokenErrorResponse";
    status: number;
    error: string;
    errorDescription: string;
}

export type FetchAccessTokenResponse = AccessTokenResponse | AccessTokenErrorResponse;

export interface CustomTokenParams {
    kind: "CustomTokenParams";
    accessToken: string;
}

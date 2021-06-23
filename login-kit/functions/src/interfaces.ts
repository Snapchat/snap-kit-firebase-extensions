/*
 * Copyright 2021 Snap, Inc.
 */

export interface AccessTokenParams {
    code: string;
    codeVerifier: string;
    redirectUri: string;
}
  
export interface CustomTokenParams {
    accessToken: string;
}

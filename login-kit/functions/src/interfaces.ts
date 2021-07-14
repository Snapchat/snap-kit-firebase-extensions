/**
 * Copyright 2021 Snap, Inc.
 */

export enum Kind {
  AccessTokenParams = "AccessTokenParams",
  AccessTokenResponse = "AccessTokenResponse",
  AccessTokenErrorResponse = "AccessTokenErrorResponse",
  Me = "Me",
  MeError = "MeError",
}

export interface AccessTokenParams {
  kind: Kind.AccessTokenParams;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface AccessTokenResponse {
  kind: Kind.AccessTokenResponse;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
  scope: string;
}

/**
 * Constructs an AccessTokenResponse
 * @param {string} accessToken
 * @param {string} tokenType
 * @param {number} expiresIn
 * @param {string} refreshToken
 * @param {string} scope
 * @return {AccessTokenResponse}
 */
export function constructAccessTokenResponse(
    accessToken: string,
    tokenType: string,
    expiresIn: number,
    refreshToken: string,
    scope: string): AccessTokenResponse {
  return {
    kind: Kind.AccessTokenResponse,
    accessToken,
    tokenType,
    expiresIn,
    refreshToken,
    scope,
  } as AccessTokenResponse;
}

export interface AccessTokenErrorResponse {
  kind: Kind.AccessTokenErrorResponse;
  status: number;
  error: string;
  errorDescription: string;
}

/**
 * Constructs an AccessTokenErrorResponse
 * @param {number} status
 * @param {string} error
 * @param {string} errorDescription
 * @return {AccessTokenErrorResponse}
 */
export function constructAccessTokenErrorResponse(status: number, error: string, errorDescription: string)
    :AccessTokenErrorResponse {
  return {
    kind: Kind.AccessTokenErrorResponse,
    status,
    error,
    errorDescription,
  } as AccessTokenErrorResponse;
}

export type FetchAccessTokenResponse = AccessTokenResponse | AccessTokenErrorResponse;

export interface Me {
    kind: Kind.Me,
    externalID: string;
}

export interface MeError {
    kind: Kind.MeError,
    message: string;
    code: string;
}

export type MeResponse = Me | MeError;

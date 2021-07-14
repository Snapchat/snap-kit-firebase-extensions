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
    externalId: string;
}

/**
 * Constructs a Me
 * @param {string} externalId
 * @return {Me}
 */
export function constructMe(externalId: string): Me {
  return {
    kind: Kind.Me,
    externalId,
  } as Me;
}

export interface MeError {
    kind: Kind.MeError,
    status: number;
    message: string;
    code: string;
}

/**
 * Constructs a MeRror
 * @param {number} status
 * @param {string} message
 * @param {string} code
 * @return {MeError}
 */
export function constructMeError(status:number, message: string, code: string): MeError {
  return {
    kind: Kind.MeError,
    status,
    message,
    code,
  } as MeError;
}

export type MeResponse = Me | MeError;

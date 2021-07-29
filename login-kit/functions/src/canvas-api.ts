/**
 * Copyright 2021 Snap, Inc.
 */

import axios from "axios";
import {JWK, JWKECKey} from "jose";

import * as config from "./config";
import {
  consturctJWKError,
  constructJWKSet,
  constructMe,
  constructMeError,
  FetchJWKResponse,
  MeResponse,
} from "./interfaces";
import * as log from "./logs";
import * as NodeCache from "node-cache";

export const fetchExternalId = (accessToken:string): Promise<MeResponse> => {
  const authorizationHeader = `Bearer ${accessToken}`;
  const headers = {
    "Content-Type": "application/json;charset=UTF-8",
    "Authorization": authorizationHeader,
  };

  const canvasApiEndpointUrl = `${config.default.canvasApiUrl}/${config.default.canvasApiEndpointPath}`;
  const query = {query: "{me{externalID}}"};

  return axios
      .post(canvasApiEndpointUrl, query, {headers})
      .then((resp) => {
        const data = resp.data.data;
        const errors = resp.data.errors;

        if (errors && errors.length > 0) {
          return constructMeError(resp.status, errors[0].message, errors[0].extensions.code);
        }

        return constructMe(data.me.externalID);
      })
      .catch((error) => {
        log.logError("error fetching external ID", error);
        return constructMeError(error.response.status, "", "");
      });
};

const CACHE = new NodeCache();
const JWKS_KEY = "canvas-api-jwks";

export const fetchJwks = (kid:string): Promise<FetchJWKResponse> => {
  if (CACHE.has(JWKS_KEY)) {
    const cachedJwks = CACHE.get<Map<string, JWK.ECKey>>(JWKS_KEY);
    if (cachedJwks) {
      const jwk = cachedJwks.get(kid);
      if (jwk) {
        return Promise.resolve(constructJWKSet(Array.from(cachedJwks.values())));
      }
    }
  }

  const jwksEndpointUrl = `${config.default.canvasApiUrl}/${config.default.jwksEndpointPath}`;
  return axios
      .get(jwksEndpointUrl, {})
      .then((resp) => {
        if (resp.status != 200) {
          return consturctJWKError(resp.status);
        }

        const jwkMap = new Map();
        resp.data.forEach((jwk:JWKECKey) => {
          jwkMap.set(jwk.kid, JWK.asKey(jwk));
        });

        if (!jwkMap.has(kid)) {
          return consturctJWKError(resp.status);
        }

        CACHE.set(JWKS_KEY, jwkMap);

        return constructJWKSet(Array.from(jwkMap.values()));
      })
      .catch((error) => {
        return consturctJWKError(error.response.status);
      });
};

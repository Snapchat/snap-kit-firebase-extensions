/**
 * Copyright 2021 Snap, Inc.
 */

import axios from "axios";

import * as config from "./config";
import {constructMe, constructMeError, MeResponse} from "./interfaces";
import * as log from "./logs";

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

/**
 * Copyright 2021 Snap, Inc.
 */

import axios from 'axios';

import * as config from "./config";
import { Me, MeError, MeResponse } from './interfaces';

export const fetchExternalId = (accessToken:String): Promise<MeResponse> => {
    const authorizationHeader = `Bearer ${accessToken}`
    const headers = {
        "Content-Type": "application/json;charset=UTF-8",
        "Authorization": authorizationHeader
    };

    const canvasApiEndpointUrl = `${config.default.canvasApiUrl}/${config.default.canvasApiEndpointPath}`;
    const query = JSON.stringify({ query: "Query{me{externalID}}" })

    return axios
        .post(canvasApiEndpointUrl, query, { headers:headers })
        .then(resp => {
            const data = resp.data.data;
            const errors = resp.data.errors;

            if (errors && errors.length > 0) {
                return {
                    message: errors[0].Message,
                    code: errors[0].Extensions.code
                } as MeError;
            }

            return {
                externalID: data.me.externalID
            } as Me;
        });
}

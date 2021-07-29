/**
 * Copyright 2021 Snap, Inc.
 */

import {expect} from "chai";
import { JWK, JWKECKey } from "jose";
import {describe, it} from "mocha";

import {verifyWebhookAuthToken} from "../src/snap-auth";

const TEST_VALID_TOKEN = "eyJraWQiOiI5MjRkZDJmMS0zYjVlLTQ0NTYtYjIyMC1iNzcyOWIyZDhjZjEiLCJ0eXAiOiJKV1QiLCJhbGc\
iOiJFUzI1NiJ9.eyJhdWQiOiJ0ZXN0LWF1ZGllbmNlIiwiaXNzIjoiU25hcGNoYXQiLCJleHAiOjE2MjczMzA4NDgsImlhdCI6MTYyNzMzMDI\
0OCwiaGFzaCI6ImUzYjBjNDQyOThmYzFjMTQ5YWZiZjRjODk5NmZiOTI0MjdhZTQxZTQ2NDliOTM0Y2E0OTU5OTFiNzg1MmI4NTUifQ.1wK8N\
nANA5EkGzFyOgKzxRWccWLAUbstaJw9_nr586_y4NozJfYcpihI7XYeFcQF94oKH8vKImNshgKFFuQzbQ";

const TEST_INVALID_TOKEN = "eyJraWQiOiI5MjRkZDJmMS0zYjVlLTQ0NTYtYjIyMC1iNzcyOWIyZDhjZjEiLCJ0eXAiOiJKV1QiLCJhbGc\
iOiJFUzI1NiJ9.eyJhdWQiOiJ0ZXN0LWF1ZGllbmNlIiwiaXNzIjoiU25hcGNoYXQiLCJleHAiOjE2MjczMzA4NDgsImlhdCI6MTYyNzMzMDI\
0OCwiaGFzaCI6ImUzYjBjNDQyOThmYzFjMTQ5YWZiZjRjODk5NmZiOTI0MjdhZTQxZTQ2NDliOTM0Y2E0OTU5OTFiNzg1MmI4NTUifQ.1wK8N\
nANA5EkGzFyOgKzxRWccWLAUbstaJw9_nr586_y4NozJfYcpihI7XYeFcQF94oKH8vKImNshgKFFuQzbQ - invalid";

const TEST_VALID_PUBLIC_KEYS = `{
    "keys":[
        {
            "kty":"EC",
            "crv":"P-256",
            "kid":"c192eb31-9d2b-4052-bdac-8c54d21878f9",
            "x":"rgabWO2mekqoG9FdIE4yKj4GQur64nH1zB5UXb_P6gM",
            "y":"PjzgXiab_yn9ZNNxeoQbtg3kQrjT3Bepa0-p_aMgy7I"
        },
        {
            "kty":"EC",
            "crv":"P-256",
            "kid":"924dd2f1-3b5e-4456-b220-b7729b2d8cf1",
            "x":"xFO87Euo0CRtWfNbF_qzPLTV4dKG1SHhgwpg-KBn6l0",
            "y":"SUmXT6nLjMq9jRKGkO0GnmpIhrbKxJ0bibtJy2bbSXo"
        }
    ]
}`;

const TEST_INVALID_PUBLIC_KEYS = `{
    "keys":[
        {
            "kty":"EC",
            "crv":"P-256",
            "kid":"c192eb31-9d2b-4052-bdac-8c54d21878f9 - no match",
            "x":"rgabWO2mekqoG9FdIE4yKj4GQur64nH1zB5UXb_P6gM",
            "y":"PjzgXiab_yn9ZNNxeoQbtg3kQrjT3Bepa0-p_aMgy7I"
        },
        {
            "kty":"EC",
            "crv":"P-256",
            "kid":"924dd2f1-3b5e-4456-b220-b7729b2d8cf1 - no match",
            "x":"xFO87Euo0CRtWfNbF_qzPLTV4dKG1SHhgwpg-KBn6l0",
            "y":"SUmXT6nLjMq9jRKGkO0GnmpIhrbKxJ0bibtJy2bbSXo"
        }
    ]
}`;

const TEST_AUDIENCE = "test-audience";

describe("Snap Auth Tests", function() {
    it('Test Token Validation Success - No Expiry Check', async function() {
        var publicJWKS: JWK.ECKey[] = JSON
          .parse(TEST_VALID_PUBLIC_KEYS)
          .keys
          .map((publicKey: JWKECKey) => JWK.asKey(publicKey));
        const isTokenValid = verifyWebhookAuthToken(TEST_VALID_TOKEN, publicJWKS, TEST_AUDIENCE, true);
        expect(isTokenValid).to.true;
    });

    it('Test Token Validation Failure - Token Expired', function() {
        var publicJWKS: JWK.ECKey[] = JSON
          .parse(TEST_VALID_PUBLIC_KEYS)
          .keys
          .map((publicKey: JWKECKey) => JWK.asKey(publicKey));
        const isTokenValid = verifyWebhookAuthToken(TEST_VALID_TOKEN, publicJWKS, TEST_AUDIENCE);
        expect(isTokenValid).to.false;
    });

    it('Test Token Validation Failure - Mismatching Audience', function() {
        var publicJWKS: JWK.ECKey[] = JSON
          .parse(TEST_VALID_PUBLIC_KEYS)
          .keys
          .map((publicKey: JWKECKey) => JWK.asKey(publicKey));
        const isTokenValid = verifyWebhookAuthToken(TEST_VALID_TOKEN, publicJWKS, "mismatching audience", true);
        expect(isTokenValid).to.false;
    });

    it('Test Token Validation Failure - Invalid Token', function() {
        var publicJWKS: JWK.ECKey[] = JSON
          .parse(TEST_VALID_PUBLIC_KEYS)
          .keys
          .map((publicKey: JWKECKey) => JWK.asKey(publicKey));
        const isTokenValid = verifyWebhookAuthToken(TEST_INVALID_TOKEN, publicJWKS, TEST_AUDIENCE, true);
        expect(isTokenValid).to.false;
    });

    it('Test Token Validation Failure - No Matching Public Key', function() {
        var publicJWKS: JWK.ECKey[] = JSON
          .parse(TEST_INVALID_PUBLIC_KEYS)
          .keys
          .map((publicKey: JWKECKey) => JWK.asKey(publicKey));
        const isTokenValid = verifyWebhookAuthToken(TEST_VALID_TOKEN, publicJWKS, TEST_AUDIENCE, true);
        expect(isTokenValid).to.false;
    });
});

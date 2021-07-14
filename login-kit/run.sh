#!/bin/bash -xeE

pushd functions;
npm run build;
popd;
firebase functions:config:get --project=snap-connect-staging > .runtimeconfig.json;
firebase ext:dev:emulators:start --test-params=test-params.env --project=snap-connect-staging;

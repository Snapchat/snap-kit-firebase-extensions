#!/bin/bash -xeE

GIT_ROOT=$(git rev-parse --show-toplevel)

pushd functions;
npm run build;
popd;
firebase functions:config:get --project=snap-connect-staging > .runtimeconfig.json;
export GOOGLE_APPLICATION_CREDENTIALS="${GIT_ROOT}/login-kit/.key.json"
echo ${GOOGLE_APPLICATION_CREDENTIALS}
firebase ext:dev:emulators:start --test-params=test-params.env --project=snap-connect-staging;

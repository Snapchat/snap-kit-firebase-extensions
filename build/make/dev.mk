SHELL := /bin/bash

##@ Dev
.PHONY: dev/setup dev/build/% dev/validate/% dev/run/%

dev/setup: dev/setup/node dev/setup/firebase

dev/setup/firebase:
	firebase login; \
	firebase --open-sesame extdev;

dev/setup/node:
	brew install node; \
	npm install -g npm; \
	npm install -g firebase-tools;

dev/validate/%:
	pushd $(@F)/functions; \
	npm install || exit 1; \
	npm run lint || exit 1; \
	npm test || exit 1; \
	popd;

dev/build/%:
	pushd $(@F)/functions; \
	npm install || exit 1; \
	npm run build || exit 1; \
	npm run test || exit 1; \
	popd; \

dev/run/%:
	pushd $(@F); \
	pushd functions; npm run build; popd;\
	firebase functions:config:get --project=snap-connect-staging > .runtimeconfig.json; \
	GIT_ROOT=$(git rev-parse --show-toplevel) ; \
	export GOOGLE_APPLICATION_CREDENTIALS=${GIT_ROOT}/login-kit/.key.json ; \
	echo ${GOOGLE_APPLICATION_CREDENTIALS} ; \
	firebase ext:dev:emulators:start --test-params=test-params.env --project=snap-connect-staging;

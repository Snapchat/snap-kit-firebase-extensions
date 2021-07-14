# Login Kit Firebase Extension

## Development

### Setup
Install node modules:
```
npm install
```

### Linter
We use [ESList](https://eslint.org/) for code linting. To analyze code:
```
npm run lint
```

### Build
```
cd functions
npm run build
```

### Run
Login Kit Firebase Extension can be run locally for end to end testing.

1. Login Kit Firebase Extension has a Cloud Function that is used to generate a
[Firebase custom token](https://firebase.google.com/docs/auth/admin/create-custom-tokens). Firebase admin credentials
need to be set up in order for custom token creation to work. A
[service account](snap-kit-firebase-ext-tester@snap-connect-staging.iam.gserviceaccount.com) has been set up for
testing purposes. Open the [key creation pane](https://console.cloud.google.com/iam-admin/serviceaccounts/details/111579715363326309113/keys?project=snap-connect-staging), then add (create) a new JSON key.
2. Add the downloaded key to the current directory (login-kit) and name the file `.key.json`.
3. Run `./run.sh` to build and run the extension.

See [Run functions locally](https://firebase.google.com/docs/functions/local-emulator) for more information.

### Deploy
TBD

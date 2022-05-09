# Snap Kit Firebase Extensions

A [Firebase Extension](https://firebase.google.com/products/extensions) is a set of [Cloud Functions](https://firebase.google.com/docs/functions) and a configuration file that performs a specific task or set of of tasks in response to HTTP requests or other triggering events. A Firebase Extension can easily be installed in a Firebase projects to perform the tasks the extension is built to do.

Snap Kit Firebase Extensions are a group of extensions that help developers integrate with various features in Snapchat.

Following are the list of extensions:
- [Login Kit Firebase Extension](login-kit)

Learn more about building Firebase Extensions [here](https://firebase.google.com/docs/extensions/alpha/overview-build-extensions).

## Setup
Run:
```
make dev/setup
```

### Setting up a new extension
1. Create a new directory for the new extension
```
mkdir creative-kit
```
2. Bootstrap the extension
```
cd creative-kit
firebase init
```

### Building an extension
Run:
```
# e.g. make dev/build/login-kit
make dev/build/<extension_dir> 
```

### Validating an extension
Run:
```
# e.g. make dev/validate/login-kit
make dev/validate/<extension-dir> 
```

### Installing and updating an extension in a Firebase project
An extension needs to be installed on a Firebase project for it to be tested end to end in a Google Cloud environment. Running the following command will install the specified extension on `snap-connect-staging` Firebase project. The installed extension points to production Snap services, including but not limited to Auth Service.

To install a new extension instance, run:
```
# e.g. make dev/install/login-kit
make dev/install/<extension-dir> 
```

To update an existing extension instance, run:
```
# e.g. make dev/update/login-kit instance-id=snapchat-login
make dev/install/<extension_dir> instance-id=<extension-instance-id>
```

### IDE
[Visual Studio Code](https://code.visualstudio.com/) is recommended.
Follow installation instructions [here](https://code.visualstudio.com/Download).

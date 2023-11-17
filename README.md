### Install

The project requires Node 16 and above.

Firstly, install all required packages for https://www.npmjs.com/package/node-fuse-bindings

Also, on a clean Ubuntu system, you need to install `pkg-config` package.

Then run

```bash
npm install
```


### Run

You should create an empty directory for mounting the filesystem before running the project.

Ensure you have the `MOUNT_PATH` environment variable set to the path where you want to mount the filesystem.

```bash
mkdir -p /tmp/fuse
MOUNT_PATH=/tmp/fuse npm start
```

In case of any crashes, you should unmount the filesystem manually.

```bash
fusermount -u /tmp/fuse
```

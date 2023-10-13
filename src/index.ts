import * as fuse from 'node-fuse-bindings';
import * as pureimage from 'pureimage';
import { PassThrough } from 'stream';
import { streamToBuffer } from './utils';
import { FSImageMetaStorage } from './images/ImageMetaStorage';
import { ObjectTreeNode } from './objectTree';
import { FUSEHandler } from './types';
import { type } from 'os';
import { rootLogger } from './logger';
import { InMemoryFileDescriptorStorage } from './fd/FileDescriptorStorage';
import { FSImageBinaryStorage } from './images/ImageBinaryStorage';
import { ImageOriginalVariant } from './images/variants/ImageOriginalVariant';
import { IImageVariant } from './images/variants/types';
import { ImageCacheVariant } from './images/variants/ImageCacheVariant';
import { InMemoryCache } from './cache/Cache';
import { IFUSEHandler } from './fuse/IFUSEHandler';
import { RootFUSEHandler } from './fuse/RootFUSEHandler';
import { ImageManagerFUSEHandler } from './fuse/ImageManagerFUSEHandler';
import { FUSEError } from './fuse/FUSEError';
import { ImagesFUSEHandler } from './fuse/ImagesFUSEHandler';

var mountPath = process.platform !== 'win32' ? './mnt' : 'M:\\';

const rf = pureimage.registerFont(
  '/usr/share/fonts/truetype/ubuntu/UbuntuMono-R.ttf',
  'Ubuntu',
);
rf.loadSync();

async function main() {
  const metaStorage = new FSImageMetaStorage('./devdata/images.json');
  const binaryStorage = new FSImageBinaryStorage('./devdata/images');
  const imagesCache = new InMemoryCache<
    ReturnType<IImageVariant['generate']>
  >();

  const rootNode = new RootFUSEHandler([
    new ImageManagerFUSEHandler(metaStorage, binaryStorage),
    new ImagesFUSEHandler(metaStorage, binaryStorage, imagesCache),
  ]);
  const fuseHandler = new FUSEHandler(
    rootNode,
    new InMemoryFileDescriptorStorage(),
  );

  const fuseLogger = rootLogger.getLogger('fuse-native');
  const handleResultWrapper = <T>(
    promise: Promise<T>,
    cb: (err: number, result: T) => void,
  ) => {
    promise
      .then((result) => {
        cb(0, result);
      })
      .catch((err) => {
        if (err instanceof FUSEError) {
          fuseLogger.warn(`FUSE error: ${err}`);
          return cb(err.code, null as T);
        }

        console.error(err);
        cb(fuse.EIO, null as T);
      });
  };
  const handleRWResultWrapper = (
    promise: Promise<number>,
    cb: (result: number) => void,
  ) => {
    promise
      .then((result) => cb(result))
      .catch((err) => {
        if (err instanceof FUSEError) {
          fuseLogger.warn(`FUSE error: ${err}`);
          return cb(err.code);
        }

        console.error(err);
        cb(fuse.EIO);
      });
  };

  fuse.mount(
    mountPath,
    {
      readdir(path, cb) {
        handleResultWrapper(fuseHandler.readdir(path), cb);
      },
      getattr(path, cb) {
        handleResultWrapper(fuseHandler.getattr(path), cb);
      },
      open(path, flags, cb) {
        handleResultWrapper(fuseHandler.open(path, flags), cb);
      },
      read(path, fd, buf, len, pos, cb) {
        handleRWResultWrapper(fuseHandler.read(fd, buf, len, pos), cb);
      },
      release: function (path, fd, cb) {
        handleResultWrapper(fuseHandler.release(path, fd), cb);
      },
      create(path, mode, cb) {
        handleResultWrapper(fuseHandler.create(path, mode), cb);
      },
      write(path, fd, buf, len, pos, cb) {
        handleRWResultWrapper(fuseHandler.write(fd, buf, len, pos), cb);
      },
      rmdir(path, cb) {
        handleResultWrapper(fuseHandler.rmdir(path), cb);
      },
      mknod(path, mode, dev, cb) {
        console.log('mknod(%s, %d, %d)', path, mode, dev);
      },
      fsync(path, fd, datasync, cb) {
        console.log('fsync(%s, %d, %d)', path, fd, datasync);
      },
      fsyncdir(path, fd, datasync, cb) {
        console.log('fsyncdir(%s, %d, %d)', path, fd, datasync);
      },
      truncate(path, size, cb) {
        console.log('truncate(%s, %d)', path, size);
      },
      ftruncate(path, fd, size, cb) {
        console.log('ftruncate(%s, %d, %d)', path, fd, size);
      },
      link(path, target, cb) {
        console.log('link(%s, %s)', path, target);
      },
      // utimens(path, atime, mtime, cb) {
      //   console.log('utimens(%s, %d, %d)', path, atime, mtime);
      // in write
      // },
      rename(src, dest, cb) {
        console.log('rename(%s, %s)', src, dest);
      },
      readlink(path, cb) {
        console.log('readlink(%s)', path);
      },
      // chmod(path, mode, cb) {
      //   console.log('chmod(%s, %d)', path, mode);
      //  in write!
      // },
      // chown(path, uid, gid, cb) {
      //   console.log('chown(%s, %d, %d)', path, uid, gid);
      // in write
      // },
      mkdir(path, mode, cb) {
        console.log('mkdir(%s, %d)', path, mode);
      },
      symlink(path, target, cb) {
        console.log('symlink(%s, %s)', path, target);
      },
      unlink(path, cb) {
        handleResultWrapper(fuseHandler.unlink(path), cb);
      },
    },
    function (err) {
      if (err) throw err;
      console.log('filesystem mounted on ' + mountPath);
    },
  );
}

main();

import * as fuse from 'node-fuse-bindings';
import * as pureimage from 'pureimage';
import { PassThrough } from 'stream';
import { streamToBuffer } from './utils/stream';
import { FSImageMetaStorage } from './images/ImageMetaStorage';
import { ObjectTreeNode } from './objectTree';
import { FUSEFacade } from './fuse/FUSEFacade';
import { type } from 'os';
import { rootLogger } from './logger';
import { InMemoryFileDescriptorStorage } from './fuse/fd/FileDescriptorStorage';
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
import { join } from 'path';

const mountPath = process.platform !== 'win32' ? './mnt' : 'M:\\';

const rf = pureimage.registerFont(
  join(__dirname, 'assets','OpenSans-Bold.ttf'),
  'Open Sans',
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
  const fuseFacade = new FUSEFacade(
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
        handleResultWrapper(fuseFacade.readdir(path), cb);
      },
      getattr(path, cb) {
        handleResultWrapper(fuseFacade.getattr(path), cb);
      },
      open(path, flags, cb) {
        handleResultWrapper(fuseFacade.open(path, flags), cb);
      },
      read(path, fd, buf, len, pos, cb) {
        handleRWResultWrapper(fuseFacade.read(fd, buf, len, pos), cb);
      },
      release: function (path, fd, cb) {
        handleResultWrapper(fuseFacade.release(path, fd), cb);
      },
      create(path, mode, cb) {
        handleResultWrapper(fuseFacade.create(path, mode), cb);
      },
      write(path, fd, buf, len, pos, cb) {
        handleRWResultWrapper(fuseFacade.write(fd, buf, len, pos), cb);
      },
      rmdir(path, cb) {
        handleResultWrapper(fuseFacade.rmdir(path), cb);
      },
      unlink(path, cb) {
        handleResultWrapper(fuseFacade.unlink(path), cb);
      },
    },
    function (err) {
      if (err) throw err;
      fuseLogger.info('filesystem mounted on ' + mountPath);
    },
  );
}

main();

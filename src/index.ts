import * as fuse from 'node-fuse-bindings';
import { FUSEFacade } from './fuse/FUSEFacade';
import { rootLogger } from './logger';
import { InMemoryCache } from './cache/Cache';
import { RootDirFUSETreeNode } from './fuse/RootDirFUSETreeNode';
import { FUSEError } from './fuse/FUSEError';
import { ImageLoaderFacade } from './images/ImageLoaderFacade';
import { ImageGeneratorComposite } from './images/generator/ImageGeneratorComposite';
import { PassThroughImageGenerator } from './images/generator/PassThroughImageGenerator';
import { TextImageGenerator } from './images/generator/TextImageGenerator';
import { FSImageMetaStorage } from './images/imageMeta/FSImageMetaStorage';
import { FSBinaryStorage } from './binaryStorage/FSBinaryStorage';
import { IImageVariant } from './images/variants/IImageVariant';
import { InMemoryFileDescriptorStorage } from './fuse/fd/InMemoryFileDescriptor';

const defaultMountPath = process.platform !== 'win32' ? './mnt' : 'M:\\';
const mountPath = process.env.MOUNT_PATH || defaultMountPath;

async function main() {
  const metaStorage = new FSImageMetaStorage('./devdata/images.json');
  const binaryStorage = new FSBinaryStorage('./devdata/images');
  const igc = new ImageGeneratorComposite();
  igc.addGenerator(new PassThroughImageGenerator());
  igc.addGenerator(new TextImageGenerator());

  const imageResolver = new ImageLoaderFacade(binaryStorage, igc);
  const imagesCache = new InMemoryCache<
    ReturnType<IImageVariant['generate']>
  >();

  const rootNode = new RootDirFUSETreeNode(
    metaStorage,
    binaryStorage,
    imageResolver,
    imagesCache,
  );
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

        fuseLogger.error(err);
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

        fuseLogger.error(err);
        cb(fuse.EIO);
      });
  };

  process.on('SIGINT', () => {
    fuse.unmount(mountPath, () => {
      fuseLogger.info('filesystem unmounted');
      process.exit();
    });
  });

  fuse.mount(
    mountPath,
    {
      options: ['direct_io'],
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
      truncate(path, size, cb) {
        fuseLogger.warn('unhandled truncate call');
        return cb(0);
      },
      flush(path, fd, cb) {
        fuseLogger.warn('unhandled flush call');
        return cb(0);
      },
      rename(src, dest, cb) {
        fuseLogger.warn('unhandled rename call');
        return cb(0);
      },
    },
    function (err) {
      if (err) throw err;
      fuseLogger.info('filesystem mounted on ' + mountPath);
    },
  );
}

main();

import * as fuse from 'node-fuse-bindings';
import * as pureimage from 'pureimage';
import { PassThrough } from 'stream';
import { streamToBuffer } from './utils';
import { FSImageMetaStorage } from './images/ImageMetaStorage';
import { ObjectTreeNode, ObjectTreeNodeBuilder } from './objectTree';
import { FUSEError, FUSEHandler, ImageOriginalVariant, ImageVariant } from './types';
import { type } from 'os';
import { rootLogger } from './logger';

var mountPath = process.platform !== 'win32' ? './mnt' : 'M:\\';

const rf = pureimage.registerFont('/usr/share/fonts/truetype/ubuntu/UbuntuMono-R.ttf', 'Ubuntu');
rf.loadSync();

async function main() {
  const builder = new ObjectTreeNodeBuilder<ImageVariant>('variantsRoot');

  builder.add('original/image.jpg', new ImageOriginalVariant());
  builder.add('original/image.webp', new ImageOriginalVariant());
  builder.add('original/image.png', new ImageOriginalVariant());
  builder.add('original/image.gif', new ImageOriginalVariant());

  builder.add('random/image.jpg', new ImageOriginalVariant());

  const fuseHandler = new FUSEHandler(
    new FSImageMetaStorage('./devdata/images.json'),
    builder.build(),
  );

  const fuseLogger = rootLogger.getLogger('fuse-native');
  const handleResultWrapper = <T>(promise: Promise<T>, cb: (err: number, result: T) => void) => {
    promise
      .then((result) => cb(0, result))
      .catch((err) => {
        if (err instanceof FUSEError) {
          fuseLogger.warn(`FUSE error: ${err}`);
          return cb(err.code, null as T);
        }

        console.error(err);
        cb(fuse.EIO, null as T);
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
      open: function (path, flags, cb) {
        console.log('open(%s, %d)', path, flags);
        if (path !== '/test.png') return cb(fuse.ENOENT, 0);
      },
      read: function (path, fd, buf, len, pos, cb) {
        console.log('read(%s, %d, %d, %d)', path, fd, len, pos);
        return cb(0);
      },
      release: function (path, fd, cb) {
        console.log('release(%s, %d)', path, fd);
        cb(0);
      },
      create(path, mode, cb) {
        handleResultWrapper(fuseHandler.create(path, mode), cb);
      },
      write(path, fd, buffer, length, position, cb) {
        console.log('write(%s, %d, %d, %d)', path, fd, length, position);
        cb(0);
      },
    },
    function (err) {
      if (err) throw err;
      console.log('filesystem mounted on ' + mountPath);
    },
  );
}

main();

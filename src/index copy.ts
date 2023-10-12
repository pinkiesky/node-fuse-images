import * as fuse from 'node-fuse-bindings';
import * as pureimage from 'pureimage';
import { PassThrough } from 'stream';
import { streamToBuffer } from './utils';
import { } from 'fs';

var mountPath = process.platform !== 'win32' ? './mnt' : 'M:\\';

let fdCounter = 1;

// 300kb
const IMAGE_FILE_SIZE = 1024 * 1024;

interface BufferMeta {
  buffer: Buffer;
  bufferSize: number;
  imageSize: number;
}

const fdToBufferMap = new Map<number, BufferMeta>();

const rf = pureimage.registerFont('/usr/share/fonts/truetype/ubuntu/UbuntuMono-R.ttf', 'Ubuntu');
rf.loadSync();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

fuse.mount(
  mountPath,
  {
    readdir: function (path, cb) {
      console.log('readdir(%s)', path);
      if (path === '/') return cb(0, ['test.png']);
      cb(0, []);
    },
    getattr: async function (path, cb) {
      console.log('getattr(%s)', path);
      if (path === '/') {
        cb(0, {
          mtime: new Date(),
          atime: new Date(),
          ctime: new Date(),
          nlink: 1,
          size: 100,
          mode: 16877,
          uid: process.getuid ? process.getuid() : 0,
          gid: process.getgid ? process.getgid() : 0,
        });
        return;
      }

      if (path === '/test.png') {
        cb(0, {
          mtime: new Date(),
          atime: new Date(),
          ctime: new Date(),
          nlink: 1,
          size: IMAGE_FILE_SIZE,
          mode: 33188,
          uid: process.getuid ? process.getuid() : 0,
          gid: process.getgid ? process.getgid() : 0,
        });
        return;
      }

      cb(fuse.ENOENT);
    },
    open: function (path, flags, cb) {
      const pathArr = path.split('/');
      const pa = pathArr.shift();
      
      console.log('open(%s, %d)', path, flags);
      if (path !== '/test.png') return cb(fuse.ENOENT, fdCounter++);
      // create image with current time
      const img = pureimage.make(480, 480);
      for (let i = 0; i < img.data.length; i += 4) {
        img.data[i] = Math.floor(Math.random() * 255);
        img.data[i + 1] = img.data[i];
        img.data[i + 2] = img.data[i];
        img.data[i + 3] = 255;
      }

      const ctx = img.getContext('2d');
      // ctx.fillStyle = 'white';
      // ctx.fillRect(0, 0, 480, 480);
      ctx.fillStyle = 'black';
      ctx.font = '20pt Ubuntu';
      ctx.fillText(new Date().toISOString(), 0, 20);
      
      const stream = new PassThrough();
      const s2b = streamToBuffer(stream);
      const encoder = pureimage.encodePNGToStream(img, stream);

      const fd = fdCounter++;
      Promise.all([s2b, encoder]).then(([buffer]) => {
        let alignedBuffer = buffer;
        if (alignedBuffer.length < IMAGE_FILE_SIZE) {
          const padding = Buffer.alloc(IMAGE_FILE_SIZE - alignedBuffer.length, 0);
          alignedBuffer = Buffer.concat([alignedBuffer, padding]);
        }

        fdToBufferMap.set(fd, {
          buffer: alignedBuffer,
          imageSize: buffer.length,
          bufferSize: alignedBuffer.length,
        });
        cb(0, fd);
      }).catch((err) => {
        console.error(err);
        cb(fuse.EIO, fd);
      });
    },
    read: function (path, fd, buf, len, pos, cb) {
      console.log('read(%s, %d, %d, %d)', path, fd, len, pos);
      const imageBuffer = fdToBufferMap.get(fd);
      if (!imageBuffer) {
        console.log('no image buffer or fd');
        return cb(0);
      }

      if (pos >= imageBuffer.bufferSize) {
        console.log('else path!');
        return cb(0);
      }

      const num = imageBuffer.buffer.copy(buf, 0, pos, pos + len);
      console.log('num: ', num);
      return cb(num);
    },
    release: function (path, fd, cb) {
      console.log('release(%s, %d)', path, fd);
      fdToBufferMap.delete(fd);
      cb(0);
    },
    create(path, mode, cb) {
      console.log('create(%s, %d)', path, mode);
      cb(0);
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

process.on('SIGINT', function () {
  fuse.unmount(mountPath, function (err) {
    if (err) {
      console.log('filesystem at ' + mountPath + ' not unmounted', err);
    } else {
      console.log('filesystem at ' + mountPath + ' unmounted');
    }
  });
});

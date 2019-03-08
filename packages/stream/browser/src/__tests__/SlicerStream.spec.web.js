// @flow
import { safePrintType } from '@tanker/errors';
import FilePonyfill from '@tanker/file-ponyfill';

import { expect } from './chai';
import SlicerStream from '../SlicerStream';

describe('SlicerStream (web)', () => {
  const bytes = new Uint8Array([48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 97, 98, 99, 100, 101, 102]); // 16 bytes
  const outputSize = 4;

  [
    { source: bytes },
    { source: bytes.buffer },
    { source: new Blob([bytes]) },
    { source: new FilePonyfill([bytes], 'file.txt') },
  ].forEach(options => {
    const { source } = options;
    const classname = safePrintType(source);

    it(`can slice a ${classname}`, async () => {
      const stream = new SlicerStream({ ...options, outputSize });

      const output: Array<Uint8Array> = [];
      stream.on('data', (data) => { output.push(data); });

      const testPromise = new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('end', () => {
          try {
            expect(output).to.have.lengthOf(Math.ceil(bytes.length / outputSize));
            output.forEach((chunk, index) => {
              expect(chunk).to.be.an.instanceOf(Uint8Array);
              expect(chunk).to.deep.equal(bytes.subarray(index * outputSize, (index + 1) * outputSize));
            });
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });

      await expect(testPromise).to.be.fulfilled;
    });
  });
});

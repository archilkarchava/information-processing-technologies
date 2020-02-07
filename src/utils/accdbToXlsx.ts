import * as fs from 'fs';
import * as JSZip from 'jszip';
import * as path from 'path';
import * as request from 'request';
import { promisify } from 'util';
import * as XLSX from 'xlsx';

const requestPromises = promisify(request);

function mergeBuffersToWorkbook(
  namedBuffers: { name: string; buffer: Buffer }[],
) {
  const workbook = XLSX.utils.book_new();
  namedBuffers.forEach(file => {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.read(file.buffer, { type: 'buffer' }).Sheets['First Sheet'],
      file.name,
    );
  });
  return workbook;
}

export default async function accdbToXlsx(inputFilePath: string) {
  const options = {
    url:
      'https://www.rebasedata.com/api/v1/convert?outputFormat=xlsx&errorResponse=json',
    method: 'POST',
    encoding: null,
    formData: {
      'files[]': {
        options: {
          contentType: 'application/accdb',
        },
        value: fs.createReadStream(inputFilePath),
      },
    },
  };
  try {
    const res = await requestPromises(options);
    try {
      const zip = await JSZip.loadAsync(res.body);
      // const filePromises: [string, Promise<Buffer>][] = []
      const namedBufferPromises: {
        name: string;
        bufferPromise: Promise<Buffer>;
      }[] = [];
      zip.forEach((relativePath, file) => {
        if (!file.name.startsWith('~TMP')) {
          namedBufferPromises.push({
            name: file.name,
            bufferPromise: zip.file(relativePath).async('nodebuffer'),
          });
        }
      });
      try {
        const namedBuffers = await Promise.all(
          namedBufferPromises.map(filePromise => {
            return filePromise.bufferPromise.then(buffer => {
              return {
                name: filePromise.name,
                buffer,
              };
            });
          }),
        );
        const mergedXlsx = mergeBuffersToWorkbook(namedBuffers);
        const outputDir = path.dirname(inputFilePath);
        const outputFileName = path.basename(inputFilePath, '.accdb');
        XLSX.writeFile(mergedXlsx, `${outputDir}/${outputFileName}.xlsx`);
      } catch (e) {
        throw new Error(e);
      }
    } catch (e) {
      throw new Error(e);
    }
  } catch (e) {
    throw new Error(e);
  }
}

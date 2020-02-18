import to from 'await-to-js';
import * as fs from 'fs';
import * as JSZip from 'jszip';
import * as path from 'path';
import * as request from 'request';
import { promisify } from 'util';
import * as XLSX from 'xlsx';

const requestPromises = promisify(request);

export default class Converter {
  private static mergeBuffersToWorkbook(
    namedBuffers: { name: string; buffer: Buffer }[],
  ) {
    const workbook = XLSX.utils.book_new();
    namedBuffers.forEach(file => {
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.read(file.buffer, { type: 'buffer' }).Sheets['First Sheet'],
        path.basename(file.name, '.xlsx'),
      );
    });
    return workbook;
  }

  public static async accdbToXlsx(inputFilePath: string) {
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
    console.log(`Uploading ${inputFilePath} to external converter api...`);
    const [reqErr, res] = await to(requestPromises(options));
    if (reqErr) {
      throw new Error(`External api request error. ${reqErr}`);
    }
    console.log('Loading zip archive...');
    const [loadZipErr, zip] = await to(JSZip.loadAsync(res.body));
    if (loadZipErr) {
      throw new Error(`Error loading zip archive. ${loadZipErr}`);
    }
    console.log('Unzipping xlsx files...');
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
    console.log('Merging xlsx into one file...');
    const mergedXlsx = this.mergeBuffersToWorkbook(namedBuffers);
    const outputDir = path.dirname(inputFilePath);
    const fileName = path.basename(inputFilePath, '.accdb');
    XLSX.writeFile(mergedXlsx, `${outputDir}/${fileName}.xlsx`);
    console.log(
      `Converted ${inputFilePath} into ${outputDir}/${fileName}.xlsx`,
    );
  }

  public static xlsxToJson(inputFilePath: string) {
    const outputDir = path.dirname(inputFilePath);
    const fileName = path.basename(inputFilePath, '.xlsx');
    const xlsxWorkbook = XLSX.readFile(inputFilePath, { cellDates: true });
    const jsonWorkbook = {};
    xlsxWorkbook.SheetNames.forEach(sheetNameWithExt => {
      const jsonSheet = XLSX.utils.sheet_to_json(
        xlsxWorkbook.Sheets[sheetNameWithExt],
      );
      const sheetName = path.basename(sheetNameWithExt, '.xlsx');
      jsonWorkbook[sheetName] = jsonSheet;
    });
    fs.writeFileSync(
      `${outputDir}/${fileName}.json`,
      JSON.stringify(jsonWorkbook, null, 2),
      'utf8',
    );
    console.log(
      `Converted ${inputFilePath} into ${outputDir}/${fileName}.json`,
    );
  }
}

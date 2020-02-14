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
        file.name,
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
    try {
      console.log(`Uploading ${inputFilePath} to external converter api...`);
      const res = await requestPromises(options);
      try {
        console.log('Unzipping xlsx...');
        const zip = await JSZip.loadAsync(res.body);
        console.log('Merging xlsx into one file...');
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
          const mergedXlsx = this.mergeBuffersToWorkbook(namedBuffers);
          const outputDir = path.dirname(inputFilePath);
          const fileName = path.basename(inputFilePath, '.accdb');
          XLSX.writeFile(mergedXlsx, `${outputDir}/${fileName}.xlsx`);
          console.log(
            `Converted ${inputFilePath} into ${outputDir}/${fileName}.xlsx`,
          );
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

  public static xlsxToJson(inputFilePath: string) {
    const outputDir = path.dirname(inputFilePath);
    const fileName = path.basename(inputFilePath, '.xlsx');
    const xlsxWorkbook = XLSX.readFile(inputFilePath);
    const fileWritePromises: Promise<void>[] = [];
    const jsonWorkbook = {};
    xlsxWorkbook.SheetNames.forEach(sheetNameWithExt => {
      const jsonSheet = XLSX.utils.sheet_to_json(
        xlsxWorkbook.Sheets[sheetNameWithExt],
      );
      const sheetName = path.basename(sheetNameWithExt, '.xlsx');
      jsonWorkbook[sheetName] = jsonSheet;
      fileWritePromises.push();
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

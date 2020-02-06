import * as fs from 'fs';
import * as JSZip from 'jszip';
import * as request from 'request';
import { promisify } from 'util';

const requestPromises = promisify(request);

export default async function accdbToXlsx(
  inputFilePath: string,
  outputDir: string,
) {
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
      const [pTable, sTable, spTable] = await Promise.all([
        zip.file('P.xlsx').async('nodebuffer'),
        zip.file('S.xlsx').async('nodebuffer'),
        zip.file('SP.xlsx').async('nodebuffer'),
      ]);
      try {
        await Promise.all([
          fs.promises.writeFile(`${outputDir}/P.xlsx`, pTable),
          fs.promises.writeFile(`${outputDir}/S.xlsx`, sTable),
          fs.promises.writeFile(`${outputDir}/SP.xlsx`, spTable),
        ]);
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

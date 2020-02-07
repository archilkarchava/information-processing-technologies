import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// interface PTableJson {
//   PID: string;
//   PName: string;
//   PCity: string;
//   Color: string;
//   Weight: string;
// }

// interface BranchProps {
//   providers: unknown[];
//   details: unknown[];
//   supplies: unknown[];
// }

// function mergeSheetsToJson(tableName: string) {
//   const providers1 = XLSX.readFile(`./data/${tableName}.xlsx`).Sheets[
//     'First Sheet'
//   ];
//   const providers2 = XLSX.readFile('./data/Branch_2.xlsx').Sheets[tableName];
//   return [
//     ...XLSX.utils.sheet_to_json(providers1),
//     ...XLSX.utils.sheet_to_json(providers2),
//   ];
// }

// function branch1ToJson() {
//   const details = XLSX.readFile(`./data/P.xlsx`).Sheets['First Sheet'];
//   const providers = XLSX.readFile(`./data/S.xlsx`).Sheets['First Sheet'];
//   const supplies = XLSX.readFile(`./data/SP.xlsx`).Sheets['First Sheet'];
//   return [
//     XLSX.utils.sheet_to_json(details),
//     XLSX.utils.sheet_to_json(providers),
//     XLSX.utils.sheet_to_json(supplies),
//   ];
// }

// function branch2ToJson() {
//   const details = XLSX.readFile('./data/Branch_2.xlsx').Sheets.S;
//   const providers = XLSX.readFile('./data/Branch_2.xlsx').Sheets.S;
//   const supplies = XLSX.readFile('./data/Branch_2.xlsx').Sheets.SP;
//   return [
//     XLSX.utils.sheet_to_json(details),
//     XLSX.utils.sheet_to_json(providers),
//     XLSX.utils.sheet_to_json(supplies),
//   ];
// }

export default async function xlsxToJson(inputFilePath: string) {
  const inputDir = path.dirname(inputFilePath);
  const inputFileName = path.basename(inputFilePath, '.xlsx');
  // const outputDir = `${inputDir}/${inputFileName}`;
  // await fsPromises.mkdir(outputDir);
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
  await fsPromises.writeFile(
    `${inputDir}/${inputFileName}.json`,
    JSON.stringify(jsonWorkbook, null, 2),
    'utf8',
  );
  // await Promise.all(fileWritePromises);
}

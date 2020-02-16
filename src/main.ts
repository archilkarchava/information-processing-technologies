import to from 'await-to-js';
import * as dotenv from 'dotenv';
import { promises as fsPromises } from 'fs';
import 'reflect-metadata';
import createTypeormConnection from './createTypeormConnection';
import Converter from './modules/converter';
import DataProcessor from './modules/dataProcessor';
import createDatabaseFunction from './queries/createDatabaseFunction';
import generateReport from './queries/generateReport';

dotenv.config();

async function main() {
  const [dbConErr] = await to(createTypeormConnection());
  if (dbConErr) {
    throw dbConErr;
  }
  const [fnQueryErr] = await to(createDatabaseFunction());
  if (fnQueryErr) {
    console.error(fnQueryErr);
  }
  const [accDbConversionErr] = await to(
    Converter.accdbToXlsx('./data/Branch_1.accdb'),
  );
  if (accDbConversionErr) {
    console.error('Access db conversion error.', accDbConversionErr);
  }
  Converter.xlsxToJson('./data/Branch_1.xlsx');
  Converter.xlsxToJson('./data/Branch_2.xlsx');
  const branch1Processor = new DataProcessor('./data/Branch_1.json');
  const [branch1PopulateErr] = await to(branch1Processor.populate());
  if (branch1PopulateErr) {
    throw branch1PopulateErr;
  }
  const branch2Processor = new DataProcessor('./data/Branch_2.json');
  const [branch2PopulateErr] = await to(branch2Processor.populate());
  if (branch2PopulateErr) {
    throw branch2PopulateErr;
  }
  const [reportQueryErr, report] = await to(generateReport(2015));
  if (reportQueryErr) {
    console.error(reportQueryErr);
  }
  await fsPromises.writeFile(
    './data/report.json',
    JSON.stringify(report, null, 2),
  );
}

main().catch(err => console.error(err));

import to from 'await-to-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import 'reflect-metadata';
import RawJsonBranchData from './interfaces/rawJsonBranchData';
import Converter from './modules/converter';
import DataProcessor from './modules/dataProcessor';
import ReportGenerator from './modules/reportGenerator';
import createDatabaseFunction from './utils/createDatabaseFunction';
import createTypeormConnection from './utils/createTypeormConnection';

dotenv.config();

async function main() {
  const [dbConErr, conneciton] = await to(createTypeormConnection());
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
  const branch1Processor = new DataProcessor(
    conneciton,
    './data/Branch_1.json',
  );
  const [branch1PopulateErr] = await to(branch1Processor.populate());
  if (branch1PopulateErr) {
    throw branch1PopulateErr;
  }
  const branch2Processor = new DataProcessor(
    conneciton,
    './data/Branch_2.json',
  );
  const branch1rawData: RawJsonBranchData = JSON.parse(
    fs.readFileSync('./data/Branch_1.json', 'utf8'),
  );
  branch2Processor.incrementIdsInRawDataBy(
    branch1rawData.P.length + 10,
    branch1rawData.S.length + 10,
    branch1rawData.SP.length + 10,
  );
  const [branch2PopulateErr] = await to(branch2Processor.populate());
  if (branch2PopulateErr) {
    throw branch2PopulateErr;
  }
  const reportGenerator = new ReportGenerator(conneciton);
  const [reportQueryErr] = await to(
    reportGenerator.generateReport1('./data/Report1.xlsx'),
  );
  if (reportQueryErr) {
    console.error(reportQueryErr);
  }
}

main()
  .then(() => process.exit())
  .catch(err => console.error(err));

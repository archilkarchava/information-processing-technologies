import to from 'await-to-js';
import * as dotenv from 'dotenv';
import 'reflect-metadata';
import createTypeormConnection from './createTypeormConnection';
import Converter from './modules/converter';
import DataProcessor from './modules/dataProcessor';

dotenv.config();

async function main() {
  const [dbConErr, connection] = await to(createTypeormConnection());
  if (dbConErr) {
    throw dbConErr;
  }
  const [dbQueryErr] = await to(
    connection.query(`CREATE OR REPLACE FUNCTION total_weight_less_than(integer, integer, float) RETURNS boolean
  AS $$ SELECT (SELECT "Weight" FROM "P" WHERE "PID" = $2) * $1 <= $3 $$
LANGUAGE SQL;`),
  );
  if (dbQueryErr) {
    throw dbQueryErr;
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
    console.error(
      'Error populating database with branch 1 data.',
      branch1PopulateErr,
    );
  }
  const branch2Processor = new DataProcessor('./data/Branch_2.json');
  const [branch2PopulateErr] = await to(branch2Processor.populate());
  if (branch2PopulateErr) {
    console.error(
      'Error populating database with branch 2 data.',
      branch2PopulateErr,
    );
  }
}

main().catch(err => console.error(err));

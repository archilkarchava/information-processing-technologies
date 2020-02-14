import * as dotenv from 'dotenv';
import 'reflect-metadata';
import createTypeormConnection from './createTypeormConnection';
import DataProcessor from './modules/dataProcessor';

dotenv.config();

async function main() {
  try {
    const connection = await createTypeormConnection();
    try {
      await connection.query(`CREATE OR REPLACE FUNCTION check_weight_constraint(integer, integer, float) RETURNS boolean
      AS $$ SELECT (SELECT "Weight" FROM "P" WHERE "PID" = $2) * $1 <= $3 $$
      LANGUAGE SQL;`);
    } catch (e) {
      throw new Error(e);
    }
  } catch (e) {
    throw new Error(e);
  }
  try {
    // await Converter.accdbToXlsx('./data/Branch_1.accdb');
    // Converter.xlsxToJson('./data/Branch_1.xlsx');
    // Converter.xlsxToJson('./data/Branch_2.xlsx');
    const branch1Processor = new DataProcessor('./data/Branch_1.json');
    await branch1Processor.populate();
    const branch2Processor = new DataProcessor('./data/Branch_2.json');
    await branch2Processor.populate();
  } catch (e) {
    throw new Error(e);
  }
}

// eslint-disable-next-line no-console
main().catch(e => console.error(e));

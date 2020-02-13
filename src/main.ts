import * as dotenv from 'dotenv';
import 'reflect-metadata';
import createTypeormConnection from './createTypeormConnection';
import Converter from './modules/converter';

async function main() {
  try {
    dotenv.config();
    await createTypeormConnection();
    // try {
    //   await connection.query(`CREATE OR REPLACE FUNCTION check_weight_constraint(integer, integer, float) RETURNS boolean
    //   AS $$ SELECT (SELECT "Weight" FROM "P" WHERE "PID" = $2) * $1 <= $3 $$
    //   LANGUAGE SQL;`);
    // } catch (e) {
    //   throw new Error(e);
    // }
  } catch (e) {
    throw new Error(e);
  }
  try {
    await Converter.accdbToXlsx('./data/Branch_1.accdb');
    Converter.xlsxToJson('./data/Branch_1.xlsx');
    Converter.xlsxToJson('./data/Branch_2.xlsx');
  } catch (e) {
    throw new Error(e);
  }
}

// eslint-disable-next-line no-console
main().catch(e => console.error(e));

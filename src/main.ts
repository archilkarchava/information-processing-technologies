import * as dotenv from 'dotenv';
import * as fs from 'fs';
import 'reflect-metadata';
import createTypeormConnection from './createTypeormConnection';
import accdbToXlsx from './utils/accdbToXlsx';

async function main() {
  try {
    const config = dotenv.parse(
      fs.readFileSync(`.env.${process.env.NODE_ENV}`),
    );
    await createTypeormConnection(config);
    // try {
    //       await connection.query(`DROP FUNCTION check_weight_constraint(integer, integer, float) RETURNS boolean
    //   AS $$ SELECT (SELECT "Weight" FROM "P" WHERE "PID" = $2) * $1 <= $3 $$
    //   LANGUAGE SQL;`);
    // } catch (e) {
    //   throw new Error(e);
    // }
  } catch (e) {
    throw new Error(e);
  }
  try {
    await accdbToXlsx('./data/Branch_1.accdb', './data');
    // xlsxToJson();
  } catch (e) {
    throw new Error(e);
  }
}

// eslint-disable-next-line no-console
main().catch(e => console.error(e));

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

import * as dotenv from "dotenv";
import * as fs from "fs";
import "reflect-metadata";
import createTypeormConnection from "./createTypeormConnection";

async function main() {
  try {
    const config = dotenv.parse(
      fs.readFileSync(`.env.${process.env.NODE_ENV}`)
    );
    await createTypeormConnection(config);
  } catch (e) {
    throw new Error(e);
  }
}

// eslint-disable-next-line no-console
main().catch(e => console.error(e));

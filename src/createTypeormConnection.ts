import { DotenvParseOutput } from "dotenv/types";
import { createConnection } from "typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

export default async function createTypeormConnection(
  config: DotenvParseOutput
) {
  const connectionOptions: PostgresConnectionOptions = {
    type: "postgres",
    host: config.TYPEORM_HOST,
    port: Number(config.TYPEORM_PORT),
    username: config.TYPEORM_USERNAME,
    password: config.TYPEORM_PASSWORD,
    database: config.TYPEORM_DATABASE,
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.NODE_ENV !== "production",
    // entities: process.env.NODE_ENV === "development" ? ["src/**/entities/*.ts"] : ["dist/**/entities/*.js"]
    entities: ["src/entity/*.js"]
  };
  await createConnection(connectionOptions);
}

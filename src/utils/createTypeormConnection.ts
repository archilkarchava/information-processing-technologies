import { createConnection } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export default async function createTypeormConnection() {
  const connectionOptions: PostgresConnectionOptions = {
    type: 'postgres',
    host: process.env.TYPEORM_HOST,
    port: Number(process.env.TYPEORM_PORT),
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    synchronize: process.env.NODE_ENV !== 'production',
    logging: false,
    entities:
      process.env.NODE_ENV === 'production'
        ? ['dist/entity/*.js']
        : ['src/entity/*.ts'],
  };
  return createConnection(connectionOptions);
}

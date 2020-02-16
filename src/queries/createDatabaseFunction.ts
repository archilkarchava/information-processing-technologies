import { getConnection } from 'typeorm';

export default function createDatabaseFunction() {
  const connection = getConnection();
  return connection.query(`CREATE OR REPLACE FUNCTION total_weight_less_than(integer, integer, float) RETURNS boolean
  AS $$ SELECT (SELECT "Weight" FROM "P" WHERE "PID" = $2) * $1 <= $3 $$
LANGUAGE SQL;`);
}

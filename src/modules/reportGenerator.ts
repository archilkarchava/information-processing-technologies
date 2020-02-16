import { getConnection } from 'typeorm';

export default function generateReport(
  year: number,
): Promise<
  {
    ShipYear: number;
    SCity: string;
    SName: string;
    TotalPrice: number;
  }[]
> {
  const connection = getConnection();
  return connection.query(`SELECT 
	EXTRACT("Year" from "SP"."ShipDate") as "ShipYear",
--	EXTRACT("Month" from "SP"."ShipDate") as "ShipMonth",
--	EXTRACT("Day" from "SP"."ShipDate") as "ShipDay",
	"S"."SCity" as "SCity",
	"S"."SName" as "SName",
	sum("SP"."Quantity" * "SP"."Price") as "TotalPrice"
FROM 
	"SP", "S"
WHERE 
	"SP"."SID" = "S"."SID"
GROUP BY 
  CUBE ("ShipYear", "SCity", "SName")
HAVING
  EXTRACT("Year" from "SP"."ShipDate") = ${year};
--  EXTRACT("Month" from "SP"."ShipDate") = 12;
--  EXTRACT("Day" from "SP"."ShipDate") = 12;`);
}

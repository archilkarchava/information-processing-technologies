import to from 'await-to-js';
import * as fs from 'fs';
import * as path from 'path';
import { Connection } from 'typeorm';
import * as XLSX from 'xlsx';

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

type ShipDateDimension = AtLeastOne<{
  year: number;
  month: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  day:
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16
    | 17
    | 18
    | 19
    | 20
    | 21
    | 22
    | 23
    | 24
    | 25
    | 26
    | 27
    | 28
    | 29
    | 30
    | 31;
}>;
type ProviderDimension = AtLeastOne<{ city: string; name: string }>;

export default class ReportGenerator {
  dbConnection: Connection;

  constructor(dbConnection: Connection) {
    this.dbConnection = dbConnection;
  }

  private static saveOnDisk(outputPath: string, report: Object[]) {
    const fileExtension = path.extname(outputPath);
    if (fileExtension === '.xlsx') {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(report));
      XLSX.writeFile(wb, outputPath);
    } else {
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    }
  }

  private static checkDate(shipDate: ShipDateDimension) {
    if (shipDate?.month < 0 || shipDate?.month > 12) {
      throw new RangeError('Invalid month number.');
    }
    if (shipDate?.day < 0 || shipDate?.day > 31) {
      throw new RangeError('Invalid day number.');
    }
  }

  private static checkFileExtension(fileExtension: string) {
    if (fileExtension !== '.xlsx' && fileExtension !== '.json') {
      throw Error('Report can only have .xlsx or .json file extension');
    }
  }

  /**
   * generateReport1
   * Вес поставок в зависимости от времени и поставщика
   * Измерения: Время (иерархия «Год > Месяц > День») и Поставщик
   * (иерархия «Город > Название»).
   * Мера: суммарный вес поставки
   */
  public async generateReport1(
    outputPath: string,
    dimensions: AtLeastOne<{
      shipDate: ShipDateDimension;
      provider: ProviderDimension;
    }>,
  ) {
    const fileExtension = path.extname(outputPath);
    ReportGenerator.checkFileExtension(fileExtension);
    console.log(`Generating type 1 report in ${outputPath}...`);
    const query = `SELECT 
  EXTRACT("Year" from "SP"."ShipDate") AS "ShipYear",
  EXTRACT("Month" from "SP"."ShipDate") AS "ShipMonth",
  EXTRACT("Day" from "SP"."ShipDate") AS "ShipDay",
  "S"."SCity" AS "SCity",
  "S"."SName" AS "SName",
  sum("SP"."Quantity" * (SELECT "Weight" FROM "P" WHERE "P"."PID" = "SP"."PID")) AS "TotalWeight"
FROM 
  "SP", "S"
WHERE 
  "SP"."SID" = "S"."SID"
GROUP BY 
  CUBE ("ShipYear", "ShipMonth", "ShipDay", "SCity", "SName")
  HAVING
    ${[
      dimensions.shipDate?.year &&
        `EXTRACT("Year" from "SP"."ShipDate") = ${dimensions.shipDate.year}`,
      dimensions.shipDate?.month &&
        `EXTRACT("Month" from "SP"."ShipDate") = ${dimensions.shipDate.month}`,
      dimensions.shipDate?.day &&
        `EXTRACT("Day" from "SP"."ShipDate") = ${dimensions.shipDate.day}`,
      dimensions.provider?.city &&
        `"S"."SCity" = '${dimensions.provider.city}'`,
      dimensions.provider?.name &&
        `"S"."SName" = '${dimensions.provider.name}'`,
    ]
      .filter(str => str)
      .join(' AND ')}`;
    const [err, report] = await to(this.dbConnection.query(query));
    if (err) throw err;
    ReportGenerator.saveOnDisk(outputPath, report);
    console.log(`Saved type 1 report in ${outputPath}.`);
  }

  /**
   * generateReport2
   * Стоимость поставок в зависимости от времени и поставщика
   * Измерения: Время (иерархия «Год > Месяц > День») и Поставщик
   * (иерархия «Город > Название»).
   * Мера: суммарная стоимость поставки.
   */

  public async generateReport2(
    outputPath: string,
    dimensions: AtLeastOne<{
      shipDate: ShipDateDimension;
      provider: ProviderDimension;
    }>,
  ) {
    const fileExtension = path.extname(outputPath);
    ReportGenerator.checkFileExtension(fileExtension);
    console.log(`Generating type 2 report in ${outputPath}...`);
    const query = `SELECT 
  EXTRACT("Year" from "SP"."ShipDate") AS "ShipYear",
  EXTRACT("Month" from "SP"."ShipDate") AS "ShipMonth",
  EXTRACT("Day" from "SP"."ShipDate") AS "ShipDay",
  "S"."SCity" AS "SCity",
  "S"."SName" AS "SName",
  sum("SP"."Quantity" * "SP"."Price") AS "TotalPrice"
FROM 
  "SP", "S"
WHERE 
  "SP"."SID" = "S"."SID"
GROUP BY 
  CUBE ("ShipYear", "ShipMonth", "ShipDay", "SCity", "SName")
  HAVING
    ${[
      dimensions.shipDate?.year &&
        `EXTRACT("Year" from "SP"."ShipDate") = ${dimensions.shipDate.year}`,
      dimensions.shipDate?.month &&
        `EXTRACT("Month" from "SP"."ShipDate") = ${dimensions.shipDate.month}`,
      dimensions.shipDate?.day &&
        `EXTRACT("Day" from "SP"."ShipDate") = ${dimensions.shipDate.day}`,
      dimensions.provider?.city &&
        `"S"."SCity" = '${dimensions.provider.city}'`,
      dimensions.provider?.name &&
        `"S"."SName" = '${dimensions.provider.name}'`,
    ]
      .filter(str => str)
      .join(' AND ')}`;
    // console.log(query);
    const [err, report] = await to(this.dbConnection.query(query));
    if (err) throw err;
    ReportGenerator.saveOnDisk(outputPath, report);
    console.log(`Saved type 2 report in ${outputPath}.`);
  }

  /**
   * generateReport3
   * Стоимость поставок в зависимости от времени и весовой категории
   * поставки
   * Измерения: Время (иерархия «Год > Месяц > День») и Весовая категория
   * поставки.
   * Измерение Весовая категория поставки предполагает следующее
   * множество значений: «легкая», «средняя», «тяжелая». Указанные значения
   * назначаются в соответствии с принадлежностью веса поставки следующим
   * числовым отрезкам: (0; 100], (100; 500] и (500; 1500].
   * Мера: суммарная стоимость поставки.
   */

  public async generateReport3(
    outputPath: string,
    dimensions: AtLeastOne<{
      shipDate: ShipDateDimension;
      weightCategory: 'легкая' | 'средняя' | 'тяжелая';
    }>,
  ) {
    const fileExtension = path.extname(outputPath);
    ReportGenerator.checkFileExtension(fileExtension);
    console.log(`Generating type 3 report in ${outputPath}...`);
    const supplyWeightSubquery =
      '(SELECT "Weight" FROM "P" WHERE "P"."PID" = "SP"."PID") * "SP"."Quantity"';
    const query = `SELECT 
  EXTRACT("Year" from "SP"."ShipDate") AS "ShipYear",
  EXTRACT("Month" from "SP"."ShipDate") AS "ShipMonth",
  EXTRACT("Day" from "SP"."ShipDate") AS "ShipDay",
  CASE
    WHEN ${supplyWeightSubquery} > 0 AND ${supplyWeightSubquery} <= 100 THEN 'легкая'
    WHEN ${supplyWeightSubquery} > 100 AND ${supplyWeightSubquery} <= 500 THEN 'средняя'
    WHEN ${supplyWeightSubquery} > 500 AND ${supplyWeightSubquery} <= 1500 THEN 'тяжелая'
  END AS "WeightCategory",
  sum("SP"."Quantity" * "SP"."Price") AS "TotalPrice"
  FROM
  "SP", "S"
WHERE
  "SP"."SID" = "S"."SID"
GROUP BY
  CUBE ("ShipYear", "ShipMonth", "ShipDay", "WeightCategory")
  HAVING
    ${[
      dimensions.shipDate?.year &&
        `EXTRACT("Year" from "SP"."ShipDate") = ${dimensions.shipDate.year}`,
      dimensions.shipDate?.month &&
        `EXTRACT("Month" from "SP"."ShipDate") = ${dimensions.shipDate.month}`,
      dimensions.shipDate?.day &&
        `EXTRACT("Day" from "SP"."ShipDate") = ${dimensions.shipDate.day}`,
      dimensions.weightCategory &&
        `CASE
      WHEN ${supplyWeightSubquery} > 0 AND ${supplyWeightSubquery} <= 100 THEN 'легкая'
      WHEN ${supplyWeightSubquery} > 100 AND ${supplyWeightSubquery} <= 500 THEN 'средняя'
      WHEN ${supplyWeightSubquery} > 500 AND ${supplyWeightSubquery} <= 1500 THEN 'тяжелая'
    END = '${dimensions.weightCategory}'`,
    ]
      .filter(str => str)
      .join(' AND ')}`;
    const [err, report] = await to(this.dbConnection.query(query));
    if (err) throw err;
    ReportGenerator.saveOnDisk(outputPath, report);
    console.log(`Saved type 3 report in ${outputPath}.`);
  }

  /**
   * generateReport4
   * Вес поставок в зависимости от времени и ценовой категории детали
   * Измерения: Время (иерархия «Год > Месяц > День») и Ценовая категория
   * детали.
   * Измерение Ценовая категория детали предполагает два значения:
   * «дешевая» (до 100 включительно), «дорогая» (более 100).
   * Мера: суммарный вес поставки.
   */

  public async generateReport4(
    outputPath: string,
    dimensions: AtLeastOne<{
      shipDate: ShipDateDimension;
      priceCategory: 'дешевая' | 'дорогая';
    }>,
  ) {
    const fileExtension = path.extname(outputPath);
    ReportGenerator.checkFileExtension(fileExtension);
    console.log(`Generating type 4 report in ${outputPath}...`);
    const query = `SELECT 
  EXTRACT("Year" from "SP"."ShipDate") AS "ShipYear",
  EXTRACT("Month" from "SP"."ShipDate") AS "ShipMonth",
  EXTRACT("Day" from "SP"."ShipDate") AS "ShipDay",
  CASE
    WHEN "SP"."Price" > 0 AND "SP"."Price" <= 100 THEN 'дешевая'
    WHEN "SP"."Price" > 100 THEN 'дорогая'
  END AS "PriceCategory",
  sum("SP"."Quantity" * (SELECT "Weight" FROM "P" WHERE "P"."PID" = "SP"."PID")) AS "TotalWeight"
  FROM
  "SP", "S"
WHERE
  "SP"."SID" = "S"."SID"
GROUP BY
  CUBE ("ShipYear", "ShipMonth", "ShipDay", "PriceCategory")
  HAVING
    ${[
      dimensions.shipDate?.year &&
        `EXTRACT("Year" from "SP"."ShipDate") = ${dimensions.shipDate.year}`,
      dimensions.shipDate?.month &&
        `EXTRACT("Month" from "SP"."ShipDate") = ${dimensions.shipDate.month}`,
      dimensions.shipDate?.day &&
        `EXTRACT("Day" from "SP"."ShipDate") = ${dimensions.shipDate.day}`,
      dimensions.priceCategory &&
        `CASE
      WHEN "SP"."Price" > 0 AND "SP"."Price" <= 100 THEN 'дешевая'
      WHEN "SP"."Price" > 100 THEN 'дорогая'
    END = '${dimensions.priceCategory}'`,
    ]
      .filter(str => str)
      .join(' AND ')}`;
    const [err, report] = await to(this.dbConnection.query(query));
    if (err) throw err;
    ReportGenerator.saveOnDisk(outputPath, report);
    console.log(`Saved type 4 report in ${outputPath}.`);
  }
}

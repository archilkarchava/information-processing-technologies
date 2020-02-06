import * as XLSX from 'xlsx';

interface PTableJson {
  PID: string;
  PName: string;
  PCity: string;
  Color: string;
  Weight: string;
}

function mergeSheetsToJson(tableName: string) {
  const providers1 = XLSX.readFile(`./data/${tableName}.xlsx`).Sheets[
    'First Sheet'
  ];
  const providers2 = XLSX.readFile('./data/Branch_2.xlsx').Sheets[tableName];
  return [
    ...XLSX.utils.sheet_to_json(providers1),
    ...XLSX.utils.sheet_to_json(providers2),
  ];
}

export default async function xlsxToJson() {
  const providers = mergeSheetsToJson('P');
  const details = mergeSheetsToJson('S');
  const supplies = mergeSheetsToJson('SP');
  console.log(providers.length);
  console.log(details.length);
  console.log(supplies.length);
}

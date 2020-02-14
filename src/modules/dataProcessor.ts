import * as fs from 'fs';
import * as _ from 'lodash';

interface InputData {
  P: Array<{
    PID: string;
    PName: string;
    PCity: string;
    Color: string;
    Weight: string;
  }>;
  S: Array<{
    SID: string;
    SName: string;
    SCity: string;
    Address: string;
    Risk: string;
  }>;
  SP: Array<{
    SPID: string;
    PID: string;
    SID: string;
    Quantity: string;
    Price: string;
    ShipDate: string;
  }>;
}

type ProviderCityAnalysis = Map<
  string,
  {
    popularity: number;
    avgRisk: number;
  }
>;

type DetailCityAnalysis = Map<
  string,
  {
    popularity: number;
    avgWeight: number;
    avgPrice: number;
    avgQuantity: number;
  }
>;

export default class DataProcessor {
  inputFilePath: string;

  rawData: InputData;

  constructor(inputFilePath: string) {
    this.inputFilePath = inputFilePath;
    this.rawData = this.readJson();
  }

  private readJson() {
    return JSON.parse(fs.readFileSync(this.inputFilePath, 'utf8'));
  }

  private static countProperty(arr: Array<Object>, mapKeyProperty: string) {
    const countMap = new Map<string, number>();
    _(arr)
      .countBy(mapKeyProperty)
      .forEach((count, name) => {
        if (name) {
          countMap.set(name, count);
        }
      });
    return countMap;
  }

  private static sumProperty(
    arr: Array<Object>,
    mapKeyProperty: string,
    summedValueProperty: string,
  ) {
    const sumMap = new Map<string, number>();
    _(arr)
      .groupBy(mapKeyProperty)
      .forEach((objects, key) => {
        if (key) {
          sumMap.set(
            key,
            _.sumBy(objects, obj => Number(obj[summedValueProperty])),
          );
        }
      });
    return sumMap;
  }

  public analyze() {
    const providerCityCount = DataProcessor.countProperty(
      this.rawData.S,
      'SCity',
    );
    const providerCityRisk = DataProcessor.sumProperty(
      this.rawData.S,
      'SCity',
      'Risk',
    );
    const detailCityCount = DataProcessor.countProperty(
      this.rawData.P,
      'PCity',
    );
    const detailCityWeight = DataProcessor.sumProperty(
      this.rawData.P,
      'PCity',
      'Weight',
    );
    const supplyTable = this.rawData.SP.map(supply => {
      const supplyCity = this.rawData.P.find(
        detail => detail.PID === supply.PID,
      ).PCity;
      return { ...supply, PCity: supplyCity };
    });
    const supplyCityCount = DataProcessor.countProperty(supplyTable, 'PCity');
    const detailCityPrice = DataProcessor.sumProperty(
      supplyTable,
      'PCity',
      'Price',
    );
    const detailCityQuantity = DataProcessor.sumProperty(
      supplyTable,
      'PCity',
      'Quantity',
    );
    const providerAnalysisMap: ProviderCityAnalysis = new Map();
    providerCityCount.forEach((count, city) => {
      providerAnalysisMap.set(city, {
        popularity: count,
        avgRisk: Math.round(providerCityRisk.get(city) / count),
      });
    });
    const detailAnalysisMap: DetailCityAnalysis = new Map();
    detailCityCount.forEach((count, city) => {
      detailAnalysisMap.set(city, {
        popularity: count,
        avgWeight: detailCityWeight.get(city) / count,
        avgPrice: detailCityPrice.get(city) / supplyCityCount.get(city),
        avgQuantity: Math.round(
          detailCityQuantity.get(city) / supplyCityCount.get(city),
        ),
      });
    });
    return { providerAnalysisMap, detailAnalysisMap };
  }

  public clean() {
    this.rawData.S.forEach(provider => {});
  }
}

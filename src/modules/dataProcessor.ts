import * as fs from 'fs';
import * as _ from 'lodash';
import { Connection, DeepPartial } from 'typeorm';
import Detail from '../entity/detail';
import Provider from '../entity/provider';
import Supply from '../entity/supply';

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

  dbConnection: Connection;

  constructor(dbConnection: Connection, inputFilePath: string) {
    this.dbConnection = dbConnection;
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

  // Removes entries with negative Weight, Quantity or Price
  private removeNegativeValues() {
    const data: InputData = {
      S: this.rawData.S,
      P: this.rawData.P.filter(detail => Number(detail.Weight) > 0),
      SP: this.rawData.SP.filter(
        supply => Number(supply.Quantity) > 0 && Number(supply.Price) > 0,
      ),
    };
    return data;
  }

  private static fixStrValue(str: string) {
    return str && str.length > 0
      ? str.replace(/[^a-zA-Zа-яА-Я0-9 ,.?!&"']/g, '')
      : null;
  }

  public async populate() {
    const data = this.rawData;
    const dataAnalysis = this.analyze();
    const mostPopularProviderCity = [
      ...dataAnalysis.providerAnalysisMap.entries(),
    ].reduce((prev, curr) =>
      prev[1].popularity > curr[1].popularity ? prev : curr,
    )[0];
    const providerRepository = this.dbConnection.getRepository(Provider);
    const providerSavePromises = data.S.map(rawProvider => {
      const provider: DeepPartial<Provider> = {
        id: Number(rawProvider.SID),
        address: DataProcessor.fixStrValue(rawProvider.Address),
        city: rawProvider.SCity
          ? DataProcessor.fixStrValue(rawProvider.SCity)
          : mostPopularProviderCity,
        name: DataProcessor.fixStrValue(rawProvider.SName),
        risk:
          rawProvider.Risk &&
          Number(rawProvider.Risk) >= 1 &&
          Number(rawProvider.Risk) <= 3
            ? Number(rawProvider.Risk)
            : dataAnalysis.providerAnalysisMap.get(
                DataProcessor.fixStrValue(rawProvider.SCity),
              ).avgRisk,
      };
      return providerRepository.save(provider);
    });
    const mostPopularDetailCity = [
      ...dataAnalysis.detailAnalysisMap.entries(),
    ].reduce((prev, curr) =>
      prev[1].popularity > curr[1].popularity ? prev : curr,
    )[0];
    const detailRepository = this.dbConnection.getRepository(Detail);
    const detailSavePromises = data.P.map(rawDetail => {
      if (!DataProcessor.fixStrValue(rawDetail.PName)) {
        return null;
      }
      const detail: DeepPartial<Detail> = {
        id: Number(rawDetail.PID),
        city: rawDetail.PCity
          ? DataProcessor.fixStrValue(rawDetail.PCity)
          : mostPopularDetailCity,
        color: DataProcessor.fixStrValue(rawDetail.Color),
        name: DataProcessor.fixStrValue(rawDetail.PName),
        weight:
          rawDetail.Weight && Number(rawDetail.Weight) > 0
            ? Number(rawDetail.Weight)
            : dataAnalysis.detailAnalysisMap.get(
                DataProcessor.fixStrValue(rawDetail.PCity),
              ).avgWeight,
      };
      return detailRepository.save(detail);
    });
    const supplyRepository = this.dbConnection.getRepository(Supply);
    const supplySavePromises = data.SP.map(rawSupply => {
      const supplyCity = data.P.find(
        rawDetail => rawDetail.PID === rawSupply.PID,
      )?.PCity;
      const supply: DeepPartial<Supply> = {
        id: Number(rawSupply.SPID),
        price:
          rawSupply.Price && Number(rawSupply.Price) > 0
            ? Number(rawSupply.Price)
            : dataAnalysis.detailAnalysisMap.get(supplyCity).avgPrice,
        quantity:
          rawSupply.Quantity && Number(rawSupply.Quantity) > 0
            ? Number(rawSupply.Quantity)
            : dataAnalysis.detailAnalysisMap.get(supplyCity).avgQuantity,
        shipDate: new Date(rawSupply.ShipDate),
        detail: { id: Number(rawSupply.PID) },
        provider: { id: Number(rawSupply.SID) },
      };
      return supplyRepository.save(supply);
    });
    console.log(
      `Populating the database with data from ${this.inputFilePath}...`,
    );
    await (Promise as any).allSettled([
      ...providerSavePromises,
      ...detailSavePromises,
      ...supplySavePromises,
    ]);
    console.log(
      `Finished populating the database with data from ${this.inputFilePath}.`,
    );
  }

  private analyze() {
    console.log(`Analyzing raw data from ${this.inputFilePath}...`);
    const data = this.removeNegativeValues();
    const providerCityCount = DataProcessor.countProperty(data.S, 'SCity');
    const providerCityRisk = DataProcessor.sumProperty(data.S, 'SCity', 'Risk');
    const detailCityCount = DataProcessor.countProperty(data.P, 'PCity');
    const detailCityWeight = DataProcessor.sumProperty(
      data.P,
      'PCity',
      'Weight',
    );
    const supplyTableWithPCity = data.SP.map(supply => {
      const supplyCity = DataProcessor.fixStrValue(
        data.P.find(detail => detail.PID === supply.PID)?.PCity,
      );
      return { ...supply, PCity: supplyCity };
    });
    const supplyCityCount = DataProcessor.countProperty(
      supplyTableWithPCity,
      'PCity',
    );
    const detailCityPrice = DataProcessor.sumProperty(
      supplyTableWithPCity,
      'PCity',
      'Price',
    );
    const detailCityQuantity = DataProcessor.sumProperty(
      supplyTableWithPCity,
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
        avgWeight: Number((detailCityWeight.get(city) / count).toFixed(2)),
        avgPrice: Number(
          (detailCityPrice.get(city) / supplyCityCount.get(city)).toFixed(2),
        ),
        avgQuantity: Math.round(
          detailCityQuantity.get(city) / supplyCityCount.get(city),
        ),
      });
    });
    return { providerAnalysisMap, detailAnalysisMap };
  }
}

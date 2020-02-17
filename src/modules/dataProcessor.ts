import * as fs from 'fs';
import * as _ from 'lodash';
import { Connection, DeepPartial } from 'typeorm';
import Detail from '../entity/detail';
import Provider from '../entity/provider';
import Supply from '../entity/supply';
import RawJsonBranchData from '../shared_types/rawJsonBranchData';

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

  rawData: RawJsonBranchData;

  dbConnection: Connection;

  constructor(dbConnection: Connection, inputFilePath: string) {
    this.dbConnection = dbConnection;
    this.inputFilePath = inputFilePath;
    this.rawData = this.readJson();
  }

  private readJson(): RawJsonBranchData {
    return JSON.parse(fs.readFileSync(this.inputFilePath, 'utf8'));
  }

  private static fixStrValue(str: string) {
    return str && str.length > 0
      ? str.replace(/[^a-zA-Zа-яёА-ЯЁ 0-9,.?!&"'-]/g, '')
      : null;
  }

  private static parseDate(str: string) {
    return str ? new Date(str.slice(0, 10)) : null;
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
      const rawSupplyCity = data.P.find(
        rawDetail => rawDetail.PID === rawSupply.PID,
      )?.PCity;
      const supplyCity =
        rawSupplyCity && DataProcessor.fixStrValue(rawSupplyCity);
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
        shipDate: DataProcessor.parseDate(rawSupply.ShipDate),
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

  private static countProperty(arr: Array<Object>, mapKeyProperty: string) {
    const countMap = new Map<string, number>();
    _(arr)
      .countBy(mapKeyProperty)
      .forEach((count, name) => {
        if (name) {
          countMap.set(DataProcessor.fixStrValue(name), count);
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
            DataProcessor.fixStrValue(key),
            _.sumBy(objects, obj => Number(obj[summedValueProperty])),
          );
        }
      });
    return sumMap;
  }

  // Removes entries with negative Weight, Quantity or Price
  private removeNegativeValues() {
    const data: RawJsonBranchData = {
      S: this.rawData.S,
      P: this.rawData.P.filter(detail => Number(detail.Weight) > 0),
      SP: this.rawData.SP.filter(
        supply => Number(supply.Quantity) > 0 && Number(supply.Price) > 0,
      ),
    };
    return data;
  }

  /**
   * incrementIdsInRawDataBy: Increments each id in rawData by a given value
   */
  public incrementIdsInRawDataBy(
    IncValPID?: number,
    IncValSID?: number,
    IncValSPID?: number,
  ) {
    /* eslint-disable no-param-reassign */
    if (IncValSID) {
      this.rawData.S.forEach(provider => {
        provider.SID = Number(provider.SID) + IncValSID;
      });
    }
    if (IncValPID) {
      this.rawData.P.forEach(detail => {
        detail.PID = Number(detail.PID) + IncValPID;
      });
    }
    if (IncValSPID) {
      this.rawData.SP.forEach(supply => {
        supply.SPID = Number(supply.SPID) + IncValSPID;
        if (IncValSID) {
          const oldSID = Number(supply.SID);
          supply.SID = Number(
            this.rawData.S.find(
              provider => Number(provider.SID) === oldSID + IncValSID,
            ).SID,
          );
        }
        if (IncValPID) {
          const oldPID = Number(supply.PID);
          supply.PID = Number(
            this.rawData.P.find(
              detail => Number(detail.PID) === oldPID + IncValPID,
            ).PID,
          );
        }
      });
    }
    /* eslint-enable no-param-reassign */
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

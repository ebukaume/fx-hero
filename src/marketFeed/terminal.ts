import MetaApi, { MetatraderCandle } from "metaapi.cloud-sdk";
import { Bar } from "../analysis/bar";
import { SYMBOLS_MAPPING, Symbol } from "../config";

export type Timeframe =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "4h"
  | "1d"
  | "1w"
  | "1mn";

export interface TerminalDriver {
  client: MetaApi;
}

export class Terminal {
  readonly digits: Record<Symbol, number> = SYMBOLS_MAPPING;

  private constructor(private client: MetaApi) {}

  static build(driver: TerminalDriver): Terminal {
    return new Terminal(driver.client);
  }

  async getCandlestickBars(
    symbol: Symbol,
    timeframe: Timeframe,
    count?: number
  ): Promise<Bar[]> {
    const account = await this.client.metatraderAccountApi.getAccountByToken();
    const candles = await account.getHistoricalCandles(
      symbol,
      timeframe,
      new Date(),
      count
    );

    this.client.close();
    const digits = this.digits[symbol];

    return this.toBar(timeframe, symbol, candles, digits).reverse();
  }

  async getHeikenAshiBarsForSymbols(
    symbols: Symbol[],
    timeframe: Timeframe,
    count?: number
  ): Promise<Bar[][]> {
    return Promise.all(
      symbols.map((symbol) => this.getHeikenAshiBars(symbol, timeframe, count))
    );
  }

  async getHeikenAshiBars(
    symbol: Symbol,
    timeframe: Timeframe,
    count?: number
  ): Promise<Bar[]> {
    const candles = await this.getCandlestickBars(symbol, timeframe, count);

    return this.toHeikenAshi(candles);
  }

  private toBar(
    timeframe: Timeframe,
    symbol: Symbol,
    candles: MetatraderCandle[],
    digits: number
  ): Bar[] {
    return candles.map(
      (candle) =>
        new Bar({
          digits,
          symbol,
          timeframe,
          startTime: candle.time,
          open: this.toDecimal(candle.open, digits),
          high: this.toDecimal(candle.high, digits),
          low: this.toDecimal(candle.low, digits),
          close: this.toDecimal(candle.close, digits),
        })
    );
  }

  private toHeikenAshi(candleSticks: Bar[]): Bar[] {
    const firstCandleIndex = candleSticks.length - 1;

    return candleSticks.reduceRight<Bar[]>(
      (result, candle, index, original) => {
        const { open, high, low, close, digits } = candle;
        const previousHa = result[index + 1];

        const previousHaOpen = previousHa
          ? previousHa.open
          : original[firstCandleIndex].open;
        const previousHaClose = previousHa
          ? previousHa.close
          : original[firstCandleIndex].close;

        const haClose = this.toDecimal((open + high + low + close) / 4, digits);
        const haOpen = this.toDecimal(
          (previousHaOpen + previousHaClose) / 2,
          digits
        );
        const haHigh = this.toDecimal(Math.max(high, haOpen, haClose), digits);
        const haLow = this.toDecimal(Math.min(low, haOpen, haClose), digits);

        result[index] = new Bar({
          ...candle,
          open: haOpen,
          high: haHigh,
          low: haLow,
          close: haClose,
        });
        return result;
      },
      []
    );
  }

  private toDecimal(value: number, places: number): number {
    return Number(value.toFixed(places));
  }
}

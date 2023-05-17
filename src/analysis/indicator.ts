import { atr, ema, macd } from "indicatorts";
import { Bar, OHLC } from "./bar";

export interface EmaInput {
  prices: Bar[];
  length: number;
  source: OHLC;
}

export type MacdColor = "GREEN" | "RED";

export class Indicator {
  static ema({ prices, length, source }: EmaInput): number[] {
    const result = ema(length, prices.map((p) => p[source]).reverse());
    const { digits } = prices[0];

    return result.map((value) => this.toDecimal(value, digits)).reverse();
  }

  static macd(prices: Bar[]): MacdColor[] {
    const { macdLine, signalLine } = macd(prices.map((p) => p.close).reverse());

    return macdLine
      .map((value, index) => (value > signalLine[index] ? "GREEN" : "RED"))
      .reverse();
  }

  static atr(prices: Bar[]): number[] {
    const reversedPrices = [...prices].reverse();
    const PERIOD = 14;
    const { digits } = prices[0];
    const highs = reversedPrices.map((price) => price.high);
    const lows = reversedPrices.map((price) => price.low);
    const closes = reversedPrices.map((price) => price.close);

    const { atrLine } = atr(PERIOD, highs, lows, closes);

    return atrLine.map((value) => this.toDecimal(value, digits)).reverse();
  }

  private static toDecimal(value: number, places: number): number {
    return Number(value.toFixed(places));
  }
}

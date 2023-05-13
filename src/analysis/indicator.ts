import { ema } from 'indicatorts';
import { Bar, OHLC } from './bar';

export interface EmaInput {
  prices: Bar[];
  length: number;
  source: OHLC;
}

export class Indicator {
  static exponentialMovingAverage({ prices, length, source }: EmaInput): number[] {
    const result = ema(length, prices.map(p => p[source]).reverse());
    const digits = prices[0].digits;

    return result.map(value => this.toDecimal(value, digits)).reverse();
  }

  private static toDecimal(value: number, places: number): number {
    return Number(value.toFixed(places));
  }
}

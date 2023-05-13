import { Symbol } from "../marketFeed/terminal";

export interface BarInput {
  symbol: Symbol;
  open: number;
  high: number;
  low: number;
  close: number;
  digits: number;
  startTime: Date;
}

export type BarType = 'BULL' | 'BEAR' | 'LIZARD';
export type BarColor = 'GREEN' | 'RED';
export type OHLC = 'open' | 'high' | 'low' | 'close';

export class Bar {
  readonly symbol: Symbol;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly digits: number;
  readonly startTime: Date;

  private readonly upperWick: number;
  private readonly lowerWick: number;
  private readonly body: number;
  private readonly whole: number;

  private readonly DOMINANCE_THRESHOLD = 5;

  constructor(input: BarInput) {
    const { open, close, high, low, digits, startTime, symbol } = input;

    this.symbol = symbol;
    this.open = open;
    this.high = high;
    this.low = low;
    this.close = close;
    this.digits = digits;
    this.startTime = startTime;

    this.upperWick = Math.abs(high - open);
    this.lowerWick = Math.abs(low - open);
    this.body = Math.abs(open - close);
    this.whole = Math.abs(high - low);
  }

  get color(): BarColor {
    /**
     * We consider doji as RED;
     * It doesn't really matter overall
    */
    return this.close > this.open ? 'GREEN' : 'RED';
  }

  get isHealthy(): boolean {
    return this.body / this.whole >= this.DOMINANCE_THRESHOLD;
  }

  get type(): BarType {
    const closedHigher = this.close > this.open;
    const closedLower = this.close < this.open;
    const bearishRejection = this.toPip(this.lowerWick);
    const bullishRejection = this.toPip(this.upperWick);

    if (closedHigher && bearishRejection < 1 && this.isHealthy) {
      return 'BULL'
    }

    if (closedLower && bullishRejection < 1 && this.isHealthy) {
      return 'BEAR'
    }

    return 'LIZARD';
  }

  private toPip(points: number): number {
    let factor = 0;

    if (this.digits <= 3) {
      factor = 0.01
    } else if (this.digits >= 4) {
      factor = 0.0001;
    }

    return Math.round(points / factor);
  }
}

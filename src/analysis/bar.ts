import { Symbol } from "../config";
import { Timeframe } from "../marketFeed/terminal";

export interface BarInput {
  symbol: Symbol;
  open: number;
  high: number;
  low: number;
  close: number;
  digits: number;
  startTime: Date;
  timeframe: Timeframe;
}

export type BarType = 'BULL' | 'BEAR' | 'LIZARD';
export type BarColor = 'GREEN' | 'RED';
export type OHLC = 'open' | 'high' | 'low' | 'close';

export class Bar {
  readonly timeframe: Timeframe;
  readonly symbol: Symbol;
  readonly startTime: Date;

  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly digits: number;

  private readonly DOMINANCE_THRESHOLD = 5;

  constructor(input: BarInput) {
    const { open, close, high, low, digits, startTime, symbol, timeframe } = input;

    this.timeframe = timeframe;
    this.symbol = symbol;
    this.startTime = startTime;

    this.open = open;
    this.high = high;
    this.low = low;
    this.close = close;
    this.digits = digits;
  }

  toJson() {
    return {
      startTime: this.startTime,
      symbol: this.symbol,
      timeframe: this.timeframe,
      type: this.type,
      color: this.color,
      digits: this.digits,

      open: this.open,
      high: this.high,
      low: this.low,
      close: this.close,

      range: this.range,
      upperWick: this.upperWick,
      lowerWick: this.lowerWick,
      body: this.body,
    }
  }

  get color(): BarColor {
    /**
     * We consider doji as RED;
     * It doesn't really matter overall
    */
    return this.close > this.open ? 'GREEN' : 'RED';
  }

  get isHealthy(): boolean {
    return this.body / this.range >= this.DOMINANCE_THRESHOLD;
  }

  get type(): BarType {
    const closedHigher = this.close > this.open;
    const closedLower = this.close < this.open;
    // TODO - Consider bar heath

    if (closedHigher && this.lowerWick < 1) {
      return 'BULL'
    }

    if (closedLower && this.upperWick < 1) {
      return 'BEAR'
    }

    return 'LIZARD';
  }

  get upperWick(): number {
    if (this.color === 'GREEN') {
      return this.toPip(Math.abs(this.high - this.close));
    }

    return this.toPip(Math.abs(this.high - this.open));
  }

  get lowerWick(): number {
    if (this.color === 'GREEN') {
      return this.toPip(Math.abs(this.low - this.open));
    }

    return this.toPip(Math.abs(this.low - this.close));
  }

  get body(): number {
    return this.toPip(Math.abs(this.close - this.open));
  }

  get range(): number {
    return this.toPip(Math.abs(this.high - this.low));
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

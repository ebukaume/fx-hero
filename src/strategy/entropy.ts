import { TradeType } from "../account/trader";
import { Bar } from "../analysis/bar";
import { Indicator } from "../analysis/indicator";
import { Pair } from "../config";
import { Metric } from "../util/metric";

type Trend = "BULLISH" | "BEARISH" | "FLAT";

export interface Signal {
  type: TradeType;
  pair: Pair;
  entry: number;
  stoploss: number;
  target: number;
  riskInPips: number;
  rewardInPips: number;
  rewardToRiskRatio: number;
}

export class EntropyStrategy {
  private readonly FAST_EMA_PERIOD = 21;
  private readonly SLOW_EMA_PERIOD = 50;
  private readonly RETRACEMENT_LOOK_BACK_WINDOW = 3;
  private readonly FRESHNESS_LOOK_BACK_WINDOW = 4;
  private readonly WRAP_RATE_THRESHOLD = 0.4;
  private readonly STOPLOSS_CLEARANCE = 10; // 1 standard pip
  private readonly REWARD_TO_RISK_RATIO = 1.1;

  private fastEma: number[] = [];
  private slowEma: number[] = [];
  private bars: Bar[] = [];

  private constructor(private technicalAnalysis: typeof Indicator) {}

  static build(technicalAnalysis: typeof Indicator) {
    return new EntropyStrategy(technicalAnalysis);
  }

  signal(bars: Bar[]): Signal | undefined {
    this.bars = bars;
    this.fastEma = this.technicalAnalysis.exponentialMovingAverage({
      prices: this.bars,
      source: "close",
      length: this.FAST_EMA_PERIOD,
    });
    this.slowEma = this.technicalAnalysis.exponentialMovingAverage({
      prices: this.bars,
      source: "close",
      length: this.SLOW_EMA_PERIOD,
    });

    if (this.trend === "FLAT") {
      return;
    }

    switch (this.trend) {
      case "BULLISH":
        return this.checkForBullishSignal();
      case "BEARISH":
        return this.checkForBearishSignal();
      default:
        return;
    }
  }

  private checkForBullishSignal(): Signal | undefined {
    const { type, pair, close: entry } = this.bars[0];

    if (type !== "BULL" || !this.isSignal()) {
      return;
    }

    const stoploss = this.stoploss;
    const target = this.target("BUY", entry, stoploss);
    const riskInPips = this.toPip(stoploss - entry);
    const rewardInPips = this.toPip(target - entry);
    const rewardToRiskRatio = +((rewardInPips / riskInPips) * -1).toFixed(2);

    const signal: Signal = {
      type: "BUY",
      pair,
      entry,
      stoploss,
      target,
      riskInPips,
      rewardInPips,
      rewardToRiskRatio,
    };

    Metric.countSignal(signal);
    return signal;
  }

  private checkForBearishSignal(): Signal | undefined {
    const { type, pair, close: entry } = this.bars[0];

    if (type !== "BEAR" || !this.isSignal()) {
      return;
    }

    const stoploss = this.stoploss;
    const target = this.target("SELL", entry, stoploss);
    const riskInPips = this.toPip(entry - stoploss);
    const rewardInPips = this.toPip(entry - target);
    const rewardToRiskRatio = +((rewardInPips / riskInPips) * -1).toFixed(2);

    const signal: Signal = {
      type: "SELL",
      pair,
      entry,
      stoploss,
      target,
      riskInPips,
      rewardInPips,
      rewardToRiskRatio,
    };

    Metric.countSignal(signal);
    return signal;
  }

  /**
   * TODO - Consider these?
   * Not too many lizards ***
   * Not new high
   */
  private isSignal(): boolean {
    return this.hasRetracedIntoFastEma() && this.isFresh();
  }

  /**
   * FLAT if sideways or spent too much time around fast ema
   * BULLISH if fast > slow
   * BEARISH if fast < slow
   */
  private get trend(): Trend {
    const fastEma = this.fastEma[0];
    const slowEma = this.slowEma[0];
    const lookBackSize = this.SLOW_EMA_PERIOD / 2;

    const bars = this.bars.slice(0, Math.ceil(lookBackSize));
    const wrappers = bars.filter((bar, index) =>
      this.isWithinRange(bar.high, bar.low, this.fastEma[index])
    );
    const wrapRatio = wrappers.length / lookBackSize;

    if (wrapRatio > this.WRAP_RATE_THRESHOLD) {
      return "FLAT";
    }

    if (fastEma > slowEma) {
      return "BULLISH";
    }

    if (fastEma < slowEma) {
      return "BEARISH";
    }

    return "FLAT";
  }

  private isWithinRange(
    upperLimit: number,
    lowerLimit: number,
    target: number
  ): boolean {
    return upperLimit >= target && lowerLimit <= target;
  }

  private hasRetracedIntoFastEma(): boolean {
    const window = this.bars.slice(0, this.RETRACEMENT_LOOK_BACK_WINDOW);

    switch (this.trend) {
      case "BULLISH":
        return !!window.find((bar, index) => bar.low <= this.fastEma[index]);
      case "BEARISH":
        return !!window.find((bar, index) => bar.high >= this.fastEma[index]);
      default:
        return false;
    }
  }

  private isFresh(): boolean {
    const window = this.bars.slice(0, this.FRESHNESS_LOOK_BACK_WINDOW);

    switch (this.trend) {
      case "BULLISH":
        return window.some((bar) => bar.color === "RED");
      case "BEARISH":
        return window.some((bar) => bar.color === "GREEN");
      case "FLAT":
        return false;
    }
  }

  private get stoploss(): number {
    switch (this.trend) {
      case "BULLISH":
        const swingLow = Math.min(
          ...this.bars
            .slice(0, this.FRESHNESS_LOOK_BACK_WINDOW)
            .map((bar) => bar.low)
        );
        return this.round(swingLow - this.toPoint(this.STOPLOSS_CLEARANCE));
      case "BEARISH":
        const swingHigh = Math.max(
          ...this.bars
            .slice(0, this.FRESHNESS_LOOK_BACK_WINDOW)
            .map((bar) => bar.high)
        );
        return this.round(swingHigh + this.toPoint(this.STOPLOSS_CLEARANCE));
      default:
        return 0;
    }
  }

  private target(
    type: TradeType,
    entryPrice: number,
    stoploss: number
  ): number {
    const risk = Math.abs(entryPrice - stoploss);

    switch (type) {
      case "BUY":
        return this.round(entryPrice + risk * this.REWARD_TO_RISK_RATIO);
      case "SELL":
        return this.round(entryPrice - risk * this.REWARD_TO_RISK_RATIO);
      default:
        return 0;
    }
  }

  private toPoint(pips: number): number {
    return this.round(pips / Math.pow(10, this.bars[0].digits));
  }

  private toPip(points: number): number {
    return this.round(points * Math.pow(10, this.bars[0].digits));
  }

  private round(value: number): number {
    return Number(value.toFixed(this.bars[0].digits));
  }
}

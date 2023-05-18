import { TradeType } from "../account/trader";
import { Bar } from "../analysis/bar";
import { Indicator, MacdColor } from "../analysis/indicator";
import { Pair } from "../config";
import { logger } from "../util/logger";
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

export class MacdStrategy {
  private readonly FAST_EMA_PERIOD = 21;
  private readonly SLOW_EMA_PERIOD = 50;
  private readonly RETRACEMENT_LOOK_BACK_WINDOW = 3;
  private readonly WRAP_LOOK_BACK_WINDOW = 5;
  private readonly WRAP_COUNT_THRESHOLD = 3;
  private readonly STOPLOSS_CLEARANCE = 10; // 1 standard pip
  private readonly REWARD_TO_RISK_RATIO = 1.05;

  private trendFastEma: number[] = [];
  private trendSlowEma: number[] = [];
  private signalFastEma: number[] = [];
  private signalSlowEma: number[] = [];
  private macd: MacdColor[];
  private atr: number[];

  private calulatedTrend: Trend | undefined;

  private constructor(
    private technicalAnalysis: typeof Indicator,
    private trendBars: Bar[],
    private signalBars: Bar[],
    private rawPrices: Bar[]
  ) { }

  static build(
    technicalAnalysis: typeof Indicator,
    trendBars: Bar[],
    signalBars: Bar[],
    rawPrices: Bar[]
  ) {
    return new MacdStrategy(
      technicalAnalysis,
      trendBars,
      signalBars,
      rawPrices
    );
  }

  signal(): Signal | undefined {
    this.trendFastEma = this.technicalAnalysis.ema({
      prices: this.trendBars,
      source: "close",
      length: this.FAST_EMA_PERIOD,
    });
    this.trendSlowEma = this.technicalAnalysis.ema({
      prices: this.trendBars,
      source: "close",
      length: this.SLOW_EMA_PERIOD,
    });

    this.signalFastEma = this.technicalAnalysis.ema({
      prices: this.signalBars,
      source: "close",
      length: this.FAST_EMA_PERIOD,
    });
    this.signalSlowEma = this.technicalAnalysis.ema({
      prices: this.signalBars,
      source: "close",
      length: this.SLOW_EMA_PERIOD,
    });

    this.macd = this.technicalAnalysis.macd(this.signalBars);
    this.atr = this.technicalAnalysis.atr(this.rawPrices);

    console.log({
      where: "signal",
      pair: this.trendBars[0].pair,
      trend: this.trend,
      barType: this.signalBars[0].type,
      barColor: this.signalBars[0].color,
      signalTrend:
        this.signalFastEma[0] > this.signalSlowEma[0] ? "BULLISH" : "BEARISH",
      hasRetracedIntoFastSignalEma: this.hasRetracedIntoFastSignalEma(),
      hasResetMacd: this.hasResetMacd(),
      justChangedColor: this.justChangedColor(),
      isStalling: this.isStalling(),
      atr: this.atr[0],
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
    const { type, pair, close: entry } = this.rawPrices[0];

    if (
      type !== "BULL" ||
      this.signalSlowEma[0] > this.signalFastEma[0] ||
      !this.isSignal()
    ) {
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

    if (!this.isSafeStoploss(stoploss) || !this.isSafeTarget(target)) {
      logger.warn("Found signal but unsafe", { signal });
      return;
    }

    Metric.countSignal(signal);
    return signal;
  }

  private checkForBearishSignal(): Signal | undefined {
    const { type, pair, close: entry } = this.rawPrices[0];

    if (
      type !== "BEAR" ||
      this.signalSlowEma[0] < this.signalFastEma[0] ||
      !this.isSignal()
    ) {
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

    if (!this.isSafeStoploss(stoploss)) {
      logger.warn("Found signal but unsafe", { signal });
      return;
    }

    Metric.countSignal(signal);
    return signal;
  }

  private isSignal(): boolean {
    return (
      this.hasRetracedIntoFastSignalEma() &&
      this.hasResetMacd() &&
      this.justChangedColor() &&
      !this.isStalling()
    );
  }

  /**
   * FLAT if sideways or spent too much time around fast ema
   * BULLISH if fast > slow and bar is GREEN
   * BEARISH if fast < slow and bar is RED
   */
  private get trend(): Trend {
    if (this.calulatedTrend) {
      return this.calulatedTrend;
    }

    const trendFastEma = this.trendFastEma[0];
    const trendSlowEma = this.trendSlowEma[0];

    const trendBars = this.trendBars.slice(0, this.WRAP_LOOK_BACK_WINDOW);
    const wrappers = trendBars.filter((bar, index) =>
      this.isWithinRange(bar.high, bar.low, this.trendFastEma[index])
    );
    const { color: lastBarColor } = this.trendBars[0];

    switch (true) {
      case wrappers.length > this.WRAP_COUNT_THRESHOLD:
        this.calulatedTrend = "FLAT";
        break;
      case trendFastEma > trendSlowEma && lastBarColor === "GREEN":
        this.calulatedTrend = "BULLISH";
        break;
      case trendFastEma < trendSlowEma && lastBarColor === "RED":
        this.calulatedTrend = "BEARISH";
        break;
      default:
        this.calulatedTrend = "FLAT";
    }

    return this.calulatedTrend;
  }

  private isWithinRange(
    upperLimit: number,
    lowerLimit: number,
    target: number
  ): boolean {
    return upperLimit >= target && lowerLimit <= target;
  }

  private hasRetracedIntoFastSignalEma(): boolean {
    const window = this.signalBars.slice(0, this.RETRACEMENT_LOOK_BACK_WINDOW);
    const tolerance = this.toPoint(5); // 0.5 pips tolerance

    switch (this.trend) {
      case "BULLISH":
        return !!window.find(
          (bar, index) => bar.low - tolerance <= this.signalFastEma[index]
        );
      case "BEARISH":
        return !!window.find(
          (bar, index) => bar.high + tolerance >= this.signalFastEma[index]
        );
      default:
        return false;
    }
  }

  private hasResetMacd(): boolean {
    switch (this.trend) {
      case "BULLISH":
        return this.macd[0] === "RED";
      case "BEARISH":
        return this.macd[0] === "GREEN";
      default:
        return false;
    }
  }

  private justChangedColor(): boolean {
    const [sinalBar, beforeSignalBar] = this.signalBars;

    switch (this.trend) {
      case "BULLISH":
        return sinalBar.color === "GREEN" && beforeSignalBar.color === "RED";
      case "BEARISH":
        return sinalBar.color === "RED" && beforeSignalBar.color === "GREEN";
      case "FLAT":
        return false;
    }
  }

  private isStalling(): boolean {
    const MAX_SIGNALS_PER_PHASE = 2;

    switch (this.trend) {
      case "BULLISH":
        const lastGreenMacdIndex = this.macd.findIndex(
          (color) => color === "GREEN"
        );
        const numberOfBulls = this.signalBars
          .slice(0, lastGreenMacdIndex)
          .reduce((count, bar) => (count += bar.color === "GREEN" ? 1 : 0), 0);
        return numberOfBulls > MAX_SIGNALS_PER_PHASE;
      case "BEARISH":
        const lastRedMacdIndex = this.macd.findIndex(
          (color) => color === "RED"
        );
        const numberOfBears = this.signalBars
          .slice(0, lastRedMacdIndex)
          .reduce((count, bar) => (count += bar.color === "GREEN" ? 1 : 0), 0);
        return numberOfBears > MAX_SIGNALS_PER_PHASE;
      case "FLAT":
        return false;
    }
  }

  private isSafeStoploss(stoploss: number): boolean {
    const atr = this.atr[0];

    return stoploss >= atr;
  }

  private isSafeTarget(target: number): boolean {
    switch (this.trend) {
      case "BULLISH":
        return target < this.getSwingHigh();
      case "BEARISH":
        return target > this.getSwingLow();
      case "FLAT":
        return false;
    }
  }

  private getSwingHigh(): number {
    const startedAt = this.macd
      .slice(1)
      .findIndex((color) => color === "GREEN");
    const endedAt = this.macd
      .slice(1)
      .findIndex(
        (color, index) => color === "RED" && this.macd[index - 1] === "GREEN"
      );
    const highs = this.rawPrices
      .slice(startedAt, endedAt + 1)
      .map((bar) => bar.high);

    return Math.max(...highs);
  }

  private getSwingLow(): number {
    const startedAt = this.macd.slice(1).findIndex((color) => color === "RED");
    const endedAt = this.macd
      .slice(1)
      .findIndex(
        (color, index) => color === "GREEN" && this.macd[index - 1] === "RED"
      );
    const lows = this.rawPrices
      .slice(startedAt, endedAt + 1)
      .map((bar) => bar.low);

    return Math.min(...lows);
  }

  private get stoploss(): number {
    const LOOK_BACK_WINDOW = 3;

    switch (this.trend) {
      case "BULLISH":
        const swingLow = Math.min(
          ...this.rawPrices.slice(0, LOOK_BACK_WINDOW).map((bar) => bar.low)
        );
        return this.round(swingLow - this.toPoint(this.STOPLOSS_CLEARANCE));
      case "BEARISH":
        const swingHigh = Math.max(
          ...this.rawPrices.slice(0, LOOK_BACK_WINDOW).map((bar) => bar.high)
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
    const reward = risk * this.REWARD_TO_RISK_RATIO;

    switch (type) {
      case "BUY":
        return this.round(entryPrice + reward);
      case "SELL":
        return this.round(entryPrice - reward);
      default:
        return 0;
    }
  }

  private toPoint(pips: number): number {
    return this.round(pips / Math.pow(10, this.signalBars[0].digits));
  }

  private toPip(points: number): number {
    return this.round(points * Math.pow(10, this.signalBars[0].digits));
  }

  private round(value: number): number {
    return Number(value.toFixed(this.signalBars[0].digits));
  }
}

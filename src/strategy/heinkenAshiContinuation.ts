import { Bar } from "../analysis/bar";
import { EmaInput } from "../analysis/indicator";

export type SignalType = "LONG" | "SHORT" | "HOLD";
type Trend = "BULLISH" | "BEARISH" | "FLAT";

export class HeikenAshiContinuation {
  private emaCalculator: ((input: EmaInput) => number[]) | undefined;
  private bars: Bar[] | undefined;
  private readonly FAST_EMA_PERIOD = 50;
  private readonly MID_EMA_PERIOD = 100;
  private readonly SLOW_EMA_PERIOD = 200;

  static build() {
    return new HeikenAshiContinuation();
  }

  withEmaIndicator(fn: (input: EmaInput) => number[]): HeikenAshiContinuation {
    this.emaCalculator = fn;

    return this;
  }

  withHeikenAshiBars(bars: Bar[]): HeikenAshiContinuation {
    this.bars = bars;

    return this;
  }

  analyse(): SignalType {
    if (this.emaCalculator === undefined) {
      throw new Error(
        'Did you call forget to "withEmaIndicator" before analyse?'
      );
    }

    if (this.bars === undefined) {
      throw new Error(
        'Did you call forget to "withHeikenAshiBars" before analyse?'
      );
    }

    const fastEma = this.emaCalculator({
      prices: this.bars,
      source: "close",
      length: this.FAST_EMA_PERIOD,
    });
    const midEma = this.emaCalculator({
      prices: this.bars,
      source: "close",
      length: this.MID_EMA_PERIOD,
    });
    const slowEma = this.emaCalculator({
      prices: this.bars,
      source: "close",
      length: this.SLOW_EMA_PERIOD,
    });

    const trend = this.deduceTrend(fastEma, midEma, slowEma);
    const latestBar = this.bars[0];

    // console.table(this.bars.slice(0, 20).map(bar => ({ ...bar, type: bar.type })))

    switch (trend) {
      case "BULLISH":
        return latestBar.type === "BULL" ? "LONG" : "HOLD";
      case "BEARISH":
        return latestBar.type === "BEAR" ? "SHORT" : "HOLD";
      default:
        return "HOLD";
    }
  }

  private deduceTrend(
    fastEma: number[],
    midEma: number[],
    slowEma: number[]
  ): Trend {
    if (fastEma > midEma && midEma > slowEma) {
      return "BULLISH";
    }

    if (fastEma < midEma && midEma < slowEma) {
      return "BEARISH";
    }

    return "FLAT";
  }
}

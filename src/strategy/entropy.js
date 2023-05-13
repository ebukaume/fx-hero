"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntropyStrategy = void 0;
class EntropyStrategy {
    technicalAnalysis;
    FAST_EMA_PERIOD = 21;
    SLOW_EMA_PERIOD = 50;
    RETRACEMENT_LOOK_BACK_WINDOW = 3;
    FRESHNESS_LOOK_BACK_WINDOW = 4;
    WRAP_RATE_THRESHOLD = 0.6;
    STOPLOSS_CLEARANCE = 2;
    REWARD_TO_RISK_RATIO = 1.1;
    fastEma = [];
    slowEma = [];
    bars = [];
    trend = 'FLAT';
    constructor(technicalAnalysis) {
        this.technicalAnalysis = technicalAnalysis;
    }
    static build(technicalAnalysis) {
        return new EntropyStrategy(technicalAnalysis);
    }
    signal(bars) {
        this.bars = bars;
        this.fastEma = this.technicalAnalysis.exponentialMovingAverage({ prices: this.bars, source: 'close', length: this.FAST_EMA_PERIOD });
        this.slowEma = this.technicalAnalysis.exponentialMovingAverage({ prices: this.bars, source: 'close', length: this.SLOW_EMA_PERIOD });
        this.trend = this.deduceTrend();
        if (this.trend === 'FLAT') {
            return;
        }
        const latest6Bars = this.bars.slice(0, 6);
        console.table(latest6Bars.map(bar => ({ ...bar, type: bar.type })));
        switch (this.trend) {
            case 'BULLISH':
                return this.checkForBullishSignal();
            case 'BEARISH':
                return this.checkForBearishSignal();
            default:
                return;
        }
    }
    checkForBullishSignal() {
        const { type, symbol, close: entry } = this.bars[0];
        if (type === 'BULL' &&
            this.isSignal()) {
            const margin = this.stopMargin;
            return {
                type: 'BUY',
                symbol,
                entry,
                stoploss: this.stoploss(margin),
                target: this.target(margin),
                rewardToRiskRatio: this.REWARD_TO_RISK_RATIO,
            };
        }
        ;
    }
    checkForBearishSignal() {
        const { type, symbol, close: entry } = this.bars[0];
        if (type === 'BEAR' &&
            this.isSignal()) {
            const margin = this.stopMargin;
            return {
                type: 'SELL',
                symbol,
                entry,
                stoploss: this.stoploss(margin),
                target: this.target(margin),
                rewardToRiskRatio: this.REWARD_TO_RISK_RATIO,
            };
        }
        ;
    }
    /**
     * has retraced into mid ema (21) -
     * changed color recently -
     * Not too many lizards ***
     * Not new high
     */
    isSignal() {
        return (this.hasRetracedIntoFastEma() &&
            this.isFresh());
    }
    /**
     * FLAT if sideways
     * BULLISH if fast > slow
     * BEARISH if fast < slow
     */
    deduceTrend() {
        const fastEma = this.fastEma[0];
        const slowEma = this.slowEma[0];
        const lookBackSize = this.SLOW_EMA_PERIOD / 2;
        const emas = this.slowEma.slice(0, Math.ceil(lookBackSize));
        const bars = this.bars.slice(0, Math.ceil(lookBackSize));
        const wrappers = bars.filter((bar, index) => this.isWithinRange(bar.low, bar.high, emas[index]));
        const wrapRatio = wrappers.length / lookBackSize;
        if (wrapRatio >= this.WRAP_RATE_THRESHOLD) {
            return 'FLAT';
        }
        if (fastEma > slowEma) {
            return 'BULLISH';
        }
        if (fastEma < slowEma) {
            return 'BEARISH';
        }
        return 'FLAT';
    }
    isWithinRange(pointA, pointB, target) {
        const upperLimit = Math.max(pointA, pointB);
        const lowerLimit = Math.min(pointA, pointB);
        return target >= lowerLimit && target <= upperLimit;
    }
    hasRetracedIntoFastEma() {
        const window = this.bars.slice(0, this.RETRACEMENT_LOOK_BACK_WINDOW);
        switch (this.trend) {
            case "BULLISH":
                return !!window
                    .find((bar, index) => bar.low <= this.fastEma[index]);
            case "BEARISH":
                return !!window
                    .find((bar, index) => bar.high >= this.fastEma[index]);
            default:
                return false;
        }
    }
    isFresh() {
        const window = this.bars.slice(0, this.FRESHNESS_LOOK_BACK_WINDOW);
        switch (this.trend) {
            case "BULLISH":
                return window.some(bar => bar.color === 'RED');
            case "BEARISH":
                return window.some(bar => bar.color === 'GREEN');
            case "FLAT":
                return false;
        }
    }
    get stopMargin() {
        const { close: entryPrice } = this.bars[0];
        switch (this.trend) {
            case "BULLISH":
                const swingLow = Math.min(...this.bars.slice(0, this.FRESHNESS_LOOK_BACK_WINDOW).map(bar => bar.low));
                const stopLevelLow = swingLow + this.toPip(this.STOPLOSS_CLEARANCE);
                return Math.abs(stopLevelLow - entryPrice);
            case "BEARISH":
                const swingHigh = Math.min(...this.bars.slice(0, this.FRESHNESS_LOOK_BACK_WINDOW).map(bar => bar.high));
                const stopLevelHigh = swingHigh + this.toPip(this.STOPLOSS_CLEARANCE);
                return Math.abs(stopLevelHigh - entryPrice);
            default:
                return 0;
        }
    }
    stoploss(margin) {
        const { close: entryPrice } = this.bars[0];
        switch (this.trend) {
            case "BULLISH":
                return entryPrice - margin;
            case "BEARISH":
                return entryPrice + margin;
            default:
                return 0;
        }
    }
    target(stopMargin) {
        const { close: entryPrice } = this.bars[0];
        switch (this.trend) {
            case "BULLISH":
                return this.round(entryPrice + (stopMargin * this.REWARD_TO_RISK_RATIO));
            case "BEARISH":
                return this.round(entryPrice - (stopMargin * this.REWARD_TO_RISK_RATIO));
            default:
                return 0;
        }
    }
    round(value) {
        return Number(value.toFixed(this.bars[0].digits));
    }
    toPip(points) {
        const { digits } = this.bars[0];
        if (digits <= 3) {
            return points * 0.01;
        }
        else if (digits >= 4) {
            return points * 0.0001;
        }
        return 0;
    }
}
exports.EntropyStrategy = EntropyStrategy;

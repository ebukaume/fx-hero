"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bar = void 0;
class Bar {
    symbol;
    open;
    high;
    low;
    close;
    digits;
    startTime;
    upperWick;
    lowerWick;
    body;
    whole;
    DOMINANCE_THRESHOLD = 5;
    constructor(input) {
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
    get color() {
        /**
         * We consider doji as RED;
         * It doesn't really matter overall
        */
        return this.close > this.open ? 'GREEN' : 'RED';
    }
    get isHealthy() {
        return this.body / this.whole >= this.DOMINANCE_THRESHOLD;
    }
    get type() {
        const closedHigher = this.close > this.open;
        const closedLower = this.close < this.open;
        const bearishRejection = this.toPip(this.lowerWick);
        const bullishRejection = this.toPip(this.upperWick);
        if (closedHigher && bearishRejection < 1 && this.isHealthy) {
            return 'BULL';
        }
        if (closedLower && bullishRejection < 1 && this.isHealthy) {
            return 'BEAR';
        }
        return 'LIZARD';
    }
    toPip(points) {
        let factor = 0;
        if (this.digits <= 3) {
            factor = 0.01;
        }
        else if (this.digits >= 4) {
            factor = 0.0001;
        }
        return Math.round(points / factor);
    }
}
exports.Bar = Bar;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Indicator = void 0;
const indicatorts_1 = require("indicatorts");
class Indicator {
    static exponentialMovingAverage({ prices, length, source }) {
        const result = (0, indicatorts_1.ema)(length, prices.map(p => p[source]).reverse());
        const digits = prices[0].digits;
        return result.map(value => this.toDecimal(value, digits)).reverse();
    }
    static toDecimal(value, places) {
        return Number(value.toFixed(places));
    }
}
exports.Indicator = Indicator;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Terminal = void 0;
const bar_1 = require("../analysis/bar");
class Terminal {
    client;
    digits = {
        EURUSDb: 5,
        GBPJPYb: 3,
        EURJPYb: 3,
    };
    constructor(client) {
        this.client = client;
    }
    static build(driver) {
        return new Terminal(driver.client);
    }
    async getCandlestickBars(symbol, timeframe, count) {
        const account = await this.client.metatraderAccountApi.getAccountByToken();
        const candles = await account.getHistoricalCandles(symbol, timeframe, new Date, count);
        this.client.close();
        const digits = this.digits[symbol];
        return this.toBar(symbol, candles, digits)
            .reverse();
    }
    async getHeikenAshiBarsForSymbols(symbols, timeframe, count) {
        return Promise.all(symbols.map(symbol => this.getHeikenAshiBars(symbol, timeframe, count)));
    }
    async getHeikenAshiBars(symbol, timeframe, count) {
        const candles = await this.getCandlestickBars(symbol, timeframe, count);
        return this.toHeikenAshi(symbol, candles);
    }
    toBar(symbol, candles, digits) {
        return candles.map(candle => new bar_1.Bar({
            digits,
            symbol,
            startTime: candle.time,
            open: this.toDecimal(candle.open, digits),
            high: this.toDecimal(candle.high, digits),
            low: this.toDecimal(candle.low, digits),
            close: this.toDecimal(candle.close, digits),
        }));
    }
    toHeikenAshi(symbol, candleSticks) {
        const firstCandleIndex = candleSticks.length - 1;
        return candleSticks.reduceRight((result, candle, index, original) => {
            const { open, high, low, close, startTime, digits } = candle;
            const previousHa = result[index + 1];
            const previousHaOpen = previousHa ? previousHa.open : original[firstCandleIndex].open;
            const previousHaClose = previousHa ? previousHa.close : original[firstCandleIndex].close;
            const haClose = this.toDecimal((open + high + low + close) / 4, digits);
            const haOpen = this.toDecimal((previousHaOpen + previousHaClose) / 2, digits);
            const haHigh = this.toDecimal(Math.max(high, haOpen, haClose), digits);
            const haLow = this.toDecimal(Math.min(low, haOpen, haClose), digits);
            result[index] = new bar_1.Bar({
                digits,
                symbol,
                startTime,
                open: haOpen,
                high: haHigh,
                low: haLow,
                close: haClose
            });
            return result;
        }, []);
    }
    toDecimal(value, places) {
        return Number(value.toFixed(places));
    }
}
exports.Terminal = Terminal;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entropy5 = void 0;
const metaapi_cloud_sdk_1 = __importDefault(require("metaapi.cloud-sdk"));
const trader_1 = require("../account/trader");
const indicator_1 = require("../analysis/indicator");
const terminal_1 = require("../marketFeed/terminal");
const telegram_1 = require("../notification/telegram");
const grammy_1 = require("grammy");
const entropy_1 = require("../strategy/entropy");
class Entropy5 {
    terminal;
    trader;
    telegram;
    NUMBER_OF_BARS_TO_FETCH = 100;
    constructor(terminal, trader, telegram) {
        this.terminal = terminal;
        this.trader = trader;
        this.telegram = telegram;
    }
    static build(config) {
        const { metaAccessToken, chatId, grammyBotToken } = config;
        const metaApiClient = new metaapi_cloud_sdk_1.default(metaAccessToken);
        const terminal = terminal_1.Terminal.build({ client: metaApiClient });
        const trader = trader_1.Trader.build({ client: metaApiClient });
        const telegram = telegram_1.Telegram.build({ client: new grammy_1.Bot(grammyBotToken) }, { chatId });
        return new this(terminal, trader, telegram);
    }
    /**
     * get price data
     * analyse data
     * if signal
     *  buy/sell
     *  notify telegram
    */
    async exec(symbols, lot) {
        const priceData = await this.terminal.getHeikenAshiBarsForSymbols(symbols, '5m', this.NUMBER_OF_BARS_TO_FETCH);
        await Promise.all(priceData.map(data => this.process(data, lot)));
    }
    async process(bars, lot) {
        const strategy = entropy_1.EntropyStrategy.build(indicator_1.Indicator);
        const signal = strategy.signal(bars);
        if (!signal) {
            console.log(`No signal at this time for ${bars[0].symbol}`);
            return;
        }
        await this.trader.open({
            ...signal,
            lot
        });
        await this.notify(signal, bars[0]);
    }
    async notify(signal, bar) {
        const { entry, stoploss, target } = signal;
        const risk = this.normalizePips(Math.abs(entry - stoploss), bar.digits);
        const reward = this.normalizePips(Math.abs(entry - target), bar.digits);
        await this.telegram.sendMessage({
            ...signal,
            risk,
            reward
        });
    }
    normalizePips(value, digits) {
        return Math.pow(10, digits) * value;
    }
}
exports.Entropy5 = Entropy5;

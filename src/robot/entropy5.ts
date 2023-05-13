import MetaApi from "metaapi.cloud-sdk";
import { Trader } from "../account/trader";
import { Indicator } from "../analysis/indicator";
import { Symbol, Terminal } from "../marketFeed/terminal";
import { Telegram } from "../notification/telegram";
import { Bot } from "grammy";
import { EntropyStrategy, Signal } from "../strategy/entropy";
import { Bar } from "../analysis/bar";

interface Config {
  chatId: string;
  metaAccessToken: string;
  grammyBotToken: string;
}

export class Entropy5 {
  private readonly NUMBER_OF_BARS_TO_FETCH = 100;

  constructor(
    private terminal: Terminal,
    private trader: Trader,
    private telegram: Telegram,
  ) { }

  static build(config: Config): Entropy5 {
    const { metaAccessToken, chatId, grammyBotToken } = config;

    const metaApiClient = new MetaApi(metaAccessToken);

    const terminal = Terminal.build({ client: metaApiClient });
    const trader = Trader.build({ client: metaApiClient })
    const telegram = Telegram.build({ client: new Bot(grammyBotToken) }, { chatId });

    return new this(terminal, trader, telegram);
  }

  /**
   * get price data
   * analyse data
   * if signal
   *  buy/sell
   *  notify telegram
  */
  async exec(symbols: Symbol[], lot: number): Promise<void> {
    const priceData = await this.terminal.getHeikenAshiBarsForSymbols(symbols, '5m', this.NUMBER_OF_BARS_TO_FETCH);

    await Promise.all(priceData.map(data => this.process(data, lot)))
  }

  private async process(bars: Bar[], lot: number): Promise<void> {
    const strategy = EntropyStrategy.build(Indicator);
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

  private async notify(signal: Signal, bar: Bar): Promise<void> {
    const { entry, stoploss, target } = signal;
    const risk = this.normalizePips(Math.abs(entry - stoploss), bar.digits)
    const reward = this.normalizePips(Math.abs(entry - target), bar.digits);

    await this.telegram.sendMessage({
      ...signal,
      risk,
      reward
    });
  }

  private normalizePips(value: number, digits: number): number {
    return Math.pow(10, digits) * value;
  }
}

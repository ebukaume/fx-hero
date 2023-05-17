import MetaApi, { RiskManagement } from "metaapi.cloud-sdk";
import { Trader } from "../../account/trader";
import { Indicator } from "../../analysis/indicator";
import { Terminal, Timeframe } from "../../marketFeed/terminal";
import { Telegram } from "../../notification/telegram";
import { Bot } from "grammy";
import { Bar } from "../../analysis/bar";
import { AccountManagement } from "../../account/management";
import { logger } from "../../util/logger";
import { Pair } from "../../config";
import { MacdStrategy } from "../../strategy/macd";

interface Config {
  signalChatId: string;
  accountId: string;
  metaAccessToken: string;
  grammyBotToken: string;
  symbols: Pair[];
  riskAmountPerTrade: number;
}

export class MacdTrendFollowerUsecase {
  private readonly NAME = "MacdTrendFollower";
  private readonly NUMBER_OF_BARS_TO_FETCH = 200;
  private readonly TREND_TIME_FRAME: Timeframe = "1h";
  private readonly SIGNAL_TIME_FRAME: Timeframe = "15m";

  constructor(
    private terminal: Terminal,
    private trader: Trader,
    private accountManagment: AccountManagement,
    private telegram: Telegram,
    private symbols: Pair[],
    private riskAmountPerTrade: number
  ) {}

  static build(config: Config): MacdTrendFollowerUsecase {
    const {
      metaAccessToken,
      signalChatId,
      grammyBotToken,
      symbols,
      riskAmountPerTrade,
      accountId,
    } = config;

    const metaApiClient = new MetaApi(metaAccessToken);
    const riskManagmentClient = new RiskManagement(metaAccessToken);

    const terminal = Terminal.build({ client: metaApiClient });
    const trader = Trader.build({ client: metaApiClient });
    const accountManagement = AccountManagement.build(
      {
        rpcClient: metaApiClient,
        riskManagmentClient,
      },
      { accountId }
    );

    const telegram = Telegram.build(
      { client: new Bot(grammyBotToken) },
      { chatId: signalChatId }
    );

    return new this(
      terminal,
      trader,
      accountManagement,
      telegram,
      symbols,
      riskAmountPerTrade
    );
  }

  async exec(): Promise<void> {
    logger.info(`[${this.NAME}] Checking for signals!`, {
      NUMBER_OF_PAIRS: this.symbols.length,
    });

    // What if we use raw candlesticks for trend?
    const higherTimeframeHeikenashi =
      await this.terminal.getHeikenAshiBarsForSymbols(
        this.symbols,
        this.TREND_TIME_FRAME,
        this.NUMBER_OF_BARS_TO_FETCH
      );

    const lowerTimeframeHeikenAshi =
      await this.terminal.getHeikenAshiBarsForSymbols(
        this.symbols,
        this.SIGNAL_TIME_FRAME,
        this.NUMBER_OF_BARS_TO_FETCH
      );

    const lowerTimeframeCandlesticks =
      await this.terminal.getCandelstickBarsForSymbols(
        this.symbols,
        this.SIGNAL_TIME_FRAME,
        this.NUMBER_OF_BARS_TO_FETCH
      );

    await Promise.all(
      this.preparePriceData(
        higherTimeframeHeikenashi,
        lowerTimeframeHeikenAshi,
        lowerTimeframeCandlesticks
      ).map(([trend, signal, raw]) => this.process(trend, signal, raw))
    );
  }

  private preparePriceData(
    higherTimeframeHeikenashi: Bar[][],
    lowerTimeframeHeikenAshi: Bar[][],
    lowerTimeframeCandlesticks: Bar[][]
  ): Bar[][][] {
    const mapping: Record<string, Bar[][]> = {};

    higherTimeframeHeikenashi.forEach(
      (data) => (mapping[data[0].toJson().pair] = [data])
    );
    lowerTimeframeHeikenAshi.forEach((data) =>
      mapping[data[0].toJson().pair].push(data)
    );
    lowerTimeframeCandlesticks.forEach((data) =>
      mapping[data[0].toJson().pair].push(data)
    );

    return Object.values(mapping);
  }

  private async process(
    trendBars: Bar[],
    signalBars: Bar[],
    rawPrices: Bar[]
  ): Promise<void> {
    const signal = MacdStrategy.build(
      Indicator,
      trendBars,
      signalBars,
      rawPrices
    ).signal();

    if (!signal) {
      return;
    }

    const lot = this.calculateLotSize(
      this.riskAmountPerTrade,
      Math.abs(signal.riskInPips)
    );

    const orderId = await this.trader.open({
      ...signal,
      lot,
    });

    const { balance, currency } =
      await this.accountManagment.getAccountInformation();
    await this.telegram.sendSignal({ ...signal, lot, botName: this.NAME });

    logger.info("Position opened!", {
      orderId,
      lot,
      currency,
      balance,
    });
  }

  private calculateLotSize(amount: number, riskInPips: number): number {
    /**
     * 0.01 => 20 pips == 2
     * 2 / (20 / 10) = 0.01
     */
    return +(amount / riskInPips).toFixed(2);
  }
}

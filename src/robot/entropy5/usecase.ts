import MetaApi, { RiskManagement } from "metaapi.cloud-sdk";
import { Trader } from "../../account/trader";
import { Indicator } from "../../analysis/indicator";
import { Terminal, Timeframe } from "../../marketFeed/terminal";
import { Telegram } from "../../notification/telegram";
import { Bot } from "grammy";
import { EntropyStrategy } from "../../strategy/entropy";
import { Bar } from "../../analysis/bar";
import { AccountManagement } from "../../account/management";
import { logger } from "../../util/logger";
import { Pair } from "../../config";

interface Config {
  signalChatId: string;
  accountId: string;
  metaAccessToken: string;
  grammyBotToken: string;
  symbols: Pair[];
  riskAmountPerTrade: number;
}

export class Entropy5RobotUsecase {
  private readonly NAME = "Entropy5Robot";
  private readonly NUMBER_OF_BARS_TO_FETCH = 100;
  private readonly TIME_FRAME: Timeframe = "5m";

  constructor(
    private terminal: Terminal,
    private trader: Trader,
    private accountManagment: AccountManagement,
    private telegram: Telegram,
    private symbols: Pair[],
    private riskAmountPerTrade: number
  ) {}

  static build(config: Config): Entropy5RobotUsecase {
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

    const priceData = await this.terminal.getHeikenAshiBarsForSymbols(
      this.symbols,
      this.TIME_FRAME,
      this.NUMBER_OF_BARS_TO_FETCH
    );

    await Promise.all(priceData.map((data) => this.process(data)));
  }

  private async process(bars: Bar[]): Promise<void> {
    const strategy = EntropyStrategy.build(Indicator);
    const signal = strategy.signal(bars);

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

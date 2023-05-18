import MetaApi, { RiskManagement } from "metaapi.cloud-sdk";
import { Telegram } from "../../notification/telegram";
import { Bot } from "grammy";
import { AccountManagement } from "../../account/management";
import { logger } from "../../util/logger";

interface Config {
  accountReportChatId: string;
  accountId: string;
  metaAccessToken: string;
  grammyBotToken: string;
}

export class AccountReportUsecase {
  private readonly NAME = "AccountReport";

  constructor(
    private accountManagment: AccountManagement,
    private telegram: Telegram
  ) {}

  static build(config: Config): AccountReportUsecase {
    const { metaAccessToken, accountReportChatId, grammyBotToken, accountId } =
      config;

    const metaApiClient = new MetaApi(metaAccessToken);
    const riskManagmentClient = new RiskManagement(metaAccessToken);

    const accountManagement = AccountManagement.build(
      {
        rpcClient: metaApiClient,
        riskManagmentClient,
      },
      { accountId }
    );

    const telegram = Telegram.build(
      { client: new Bot(grammyBotToken) },
      { chatId: accountReportChatId }
    );

    return new this(accountManagement, telegram);
  }

  async exec(): Promise<void> {
    logger.info(`[${this.NAME}] Running account report`);

    // await Promise.all([]);
    await this.dailyReport();
  }

  private async dailyReport(): Promise<void> {
    const data = await this.accountManagment.report();
  }
}

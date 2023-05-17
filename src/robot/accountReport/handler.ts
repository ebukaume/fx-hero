import { HandlerBuilder } from "../../util/handlerBuilder";
import { AccountReportUsecase } from "./usecase";

export interface AccountReportConfig {
  accountReportChatId: string;
  accountId: string;
  metaAccessToken: string;
  grammyBotToken: string;
}

export class AccountReportHandler {
  private constructor(private usecase: AccountReportUsecase) { }

  async handle(time: string) {
    await this.usecase.exec();
  }

  static build({
    accountReportChatId,
    metaAccessToken,
    grammyBotToken,
    accountId,
  }: AccountReportConfig) {
    const usecase = AccountReportUsecase.build({
      accountReportChatId,
      accountId,
      metaAccessToken,
      grammyBotToken,
    });

    const handler = new AccountReportHandler(usecase);

    return HandlerBuilder.scheduledLambda(handler.handle.bind(handler));
  }
}

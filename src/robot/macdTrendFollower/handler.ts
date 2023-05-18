import { Pair } from "../../config";
import { HandlerBuilder } from "../../util/handlerBuilder";
import { MacdTrendFollowerUsecase } from "./usecase";

export interface MacdTrendFollowerConfig {
  signalChatId: string;
  accountId: string;
  metaAccessToken: string;
  grammyBotToken: string;
  symbols: Pair[];
  riskAmountPerTrade: number;
}

export class MacdTrendFollowerHandler {
  private constructor(private usecase: MacdTrendFollowerUsecase) {}

  async handle(time: string) {
    // TODO - Use time to make invocations idempotent
    await this.usecase.exec();
  }

  static build({
    symbols,
    riskAmountPerTrade,
    signalChatId,
    metaAccessToken,
    grammyBotToken,
    accountId,
  }: MacdTrendFollowerConfig) {
    const usecase = MacdTrendFollowerUsecase.build({
      signalChatId,
      metaAccessToken,
      grammyBotToken,
      symbols,
      riskAmountPerTrade,
      accountId,
    });

    const handler = new MacdTrendFollowerHandler(usecase);

    return HandlerBuilder.scheduledLambda(handler.handle.bind(handler));
  }
}

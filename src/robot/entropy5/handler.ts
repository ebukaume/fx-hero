import { Pair } from "../../config";
import { HandlerBuilder } from "../../util/handlerBuilder";
import { Entropy5RobotUsecase } from "./usecase";

export interface Entropy5RobotConfig {
  signalChatId: string;
  accountId: string;
  metaAccessToken: string;
  grammyBotToken: string;
  symbols: Pair[];
  riskAmountPerTrade: number;
}

export class Entropy5RobotHandler {
  private constructor(private usecase: Entropy5RobotUsecase) {}

  async handle(time: string) {
    await this.usecase.exec();
  }

  static build({
    symbols,
    riskAmountPerTrade,
    signalChatId,
    metaAccessToken,
    grammyBotToken,
    accountId,
  }: Entropy5RobotConfig) {
    const usecase = Entropy5RobotUsecase.build({
      signalChatId,
      metaAccessToken,
      grammyBotToken,
      symbols,
      riskAmountPerTrade,
      accountId,
    });

    const handler = new Entropy5RobotHandler(usecase);

    return HandlerBuilder.scheduledLambda(handler.handle.bind(handler));
  }
}

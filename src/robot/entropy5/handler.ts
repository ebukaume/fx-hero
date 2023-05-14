import { Symbol } from "../../config";
import { HandlerBuilder } from "../../util/handlerBuilder";
import { Entropy5RobotUsecase } from "./usecase";

export interface Entropy5RobotConfig {
  chatId: string;
  metaAccessToken: string;
  grammyBotToken: string;
  symbols: Symbol[];
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
    chatId,
    metaAccessToken,
    grammyBotToken,
  }: Entropy5RobotConfig) {
    const usecase = Entropy5RobotUsecase.build({
      chatId,
      metaAccessToken,
      grammyBotToken,
      symbols,
      riskAmountPerTrade,
    });

    const handler = new Entropy5RobotHandler(usecase);

    return HandlerBuilder.scheduledLambda(handler.handle.bind(handler));
  }
}

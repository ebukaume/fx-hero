import { ACCESS_TOKEN, BOT_TOKEN, CHAT_ID, PAIRS } from "../../config";
import { Entropy5RobotHandler, Entropy5RobotConfig } from "./handler";

const config: Entropy5RobotConfig = {
  chatId: CHAT_ID,
  metaAccessToken: ACCESS_TOKEN,
  grammyBotToken: BOT_TOKEN,
  symbols: PAIRS,
  riskAmountPerTrade: 500,
};

export const handler = Entropy5RobotHandler.build(config);

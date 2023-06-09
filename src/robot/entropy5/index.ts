import {
  META_API_ACCESS_TOKEN,
  TELEGRAM_BOT_TOKEN,
  SIGNAL_CHAT_ID,
  PAIRS,
  ACCOUNT_ID,
} from "../../config";
import { Entropy5RobotHandler, Entropy5RobotConfig } from "./handler";

const config: Entropy5RobotConfig = {
  accountId: ACCOUNT_ID,
  signalChatId: SIGNAL_CHAT_ID,
  metaAccessToken: META_API_ACCESS_TOKEN,
  grammyBotToken: TELEGRAM_BOT_TOKEN,
  symbols: PAIRS,
  riskAmountPerTrade: 500,
};

export const handler = Entropy5RobotHandler.build(config);

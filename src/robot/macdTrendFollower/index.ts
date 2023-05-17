import {
  META_API_ACCESS_TOKEN,
  TELEGRAM_BOT_TOKEN,
  SIGNAL_CHAT_ID,
  PAIRS,
  ACCOUNT_ID,
} from "../../config";
import { MacdTrendFollowerHandler, MacdTrendFollowerConfig } from "./handler";

const config: MacdTrendFollowerConfig = {
  accountId: ACCOUNT_ID,
  signalChatId: SIGNAL_CHAT_ID,
  metaAccessToken: META_API_ACCESS_TOKEN,
  grammyBotToken: TELEGRAM_BOT_TOKEN,
  symbols: PAIRS,
  riskAmountPerTrade: 500,
};

export const handler = MacdTrendFollowerHandler.build(config);

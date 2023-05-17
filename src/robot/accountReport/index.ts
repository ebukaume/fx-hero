import {
  META_API_ACCESS_TOKEN,
  TELEGRAM_BOT_TOKEN,
  SIGNAL_CHAT_ID,
  ACCOUNT_ID,
} from "../../config";
import { AccountReportHandler, AccountReportConfig } from "./handler";

const config: AccountReportConfig = {
  accountId: ACCOUNT_ID,
  accountReportChatId: SIGNAL_CHAT_ID,
  metaAccessToken: META_API_ACCESS_TOKEN,
  grammyBotToken: TELEGRAM_BOT_TOKEN,
};

export const handler = AccountReportHandler.build(config);

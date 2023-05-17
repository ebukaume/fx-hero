import {
  META_API_ACCESS_TOKEN,
  TELEGRAM_BOT_TOKEN,
  SIGNAL_CHAT_ID,
  ACCOUNT_ID,
  // ACCOUNT_REPORT_CHAT_ID,
} from "./config";
import { Job } from "./job";
// import { AccountReportUsecase } from "./robot/accountReport/usecase";
// import { Entropy5RobotUsecase } from "./robot/entropy5/usecase";
import { MacdTrendFollowerUsecase } from "./robot/macdTrendFollower/usecase";

const EVERY_5_MINUTES = "*/1 * * * *";
// const EVERY_DAY = '0 0 * * *' // 00:00 UTC
// const EVERY_DAY = "*/2 * * * *"; // 00:00 UTC
const riskAmountPerTrade = 1000;

async function run(): Promise<void> {
  // const entropy5 = Entropy5RobotUsecase.build({
  //   accountId: ACCOUNT_ID,
  //   signalChatId: SIGNAL_CHAT_ID,
  //   metaAccessToken: META_API_ACCESS_TOKEN,
  //   grammyBotToken: TELEGRAM_BOT_TOKEN,
  //   symbols: ["EURUSDb"],
  //   riskAmountPerTrade,
  // });

  // const accountReport = AccountReportUsecase.build({
  //   accountId: ACCOUNT_ID,
  //   accountReportChatId: ACCOUNT_REPORT_CHAT_ID,
  //   metaAccessToken: META_API_ACCESS_TOKEN,
  //   grammyBotToken: TELEGRAM_BOT_TOKEN,
  // });

  const macdTrendFollower = MacdTrendFollowerUsecase.build({
    accountId: ACCOUNT_ID,
    signalChatId: SIGNAL_CHAT_ID,
    metaAccessToken: META_API_ACCESS_TOKEN,
    grammyBotToken: TELEGRAM_BOT_TOKEN,
    symbols: ["AUDJPYb"],
    riskAmountPerTrade,
  });

  Job.schedule([
    // {
    //   name: "Entropy 5M",
    //   cronExpression: EVERY_5_MINUTES,
    //   executor: entropy5.exec.bind(entropy5),
    // },
    // {
    //   name: "Account Report",
    //   cronExpression: EVERY_DAY,
    //   executor: accountReport.exec.bind(accountReport),
    // },
    {
      name: "MACD trend follwer",
      cronExpression: EVERY_5_MINUTES,
      executor: macdTrendFollower.exec.bind(macdTrendFollower),
    },
  ]);
}

run().catch(console.error);

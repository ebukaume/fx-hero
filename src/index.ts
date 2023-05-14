import { ACCESS_TOKEN, BOT_TOKEN, CHAT_ID } from "./config";
import { Job } from "./job";
import { Entropy5RobotUsecase } from "./robot/entropy5/usecase";

const EVERY_5_MINUTES = "*/5 * * * *";
const riskAmountPerTrade = 1000;

async function run(): Promise<void> {
  const entropy5 = Entropy5RobotUsecase.build({
    chatId: CHAT_ID,
    metaAccessToken: ACCESS_TOKEN,
    grammyBotToken: BOT_TOKEN,
    symbols: ["EURUSDb"],
    riskAmountPerTrade,
  });

  Job.schedule([
    {
      name: "Entropy 5M",
      cronExpression: EVERY_5_MINUTES,
      executor: entropy5.exec.bind(entropy5),
    },
  ]);
}

run().catch(console.error);

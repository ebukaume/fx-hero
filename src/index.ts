import { ACCESS_TOKEN, BOT_TOKEN, CHAT_ID, SYMBOLS } from "./config";
import { Job } from "./job";
import { Entropy5Robot } from "./robot/entropy5";

async function run() {
  const riskAmountPerTrade = 1000;
  const cronExpression = '*/1 * * * *';

  const entropy = Entropy5Robot.build({
    chatId: CHAT_ID,
    metaAccessToken: ACCESS_TOKEN,
    grammyBotToken: BOT_TOKEN,
  })

  Job.schedule([
    {
      name: 'Entropy 5M',
      cronExpression,
      executor: () => entropy.exec({ symbols: SYMBOLS, riskAmountPerTrade }),
    }
  ])
}

run().catch(console.error);
import { ACCESS_TOKEN, BOT_TOKEN, CHAT_ID } from "./config";
import { Symbol } from "./marketFeed/terminal";
import { Job } from "./job";
import { Entropy5 } from "./robot/entropy5";

async function run() {
  const symbolToTrade: Symbol[] = ['EURJPYb', 'EURUSDb', 'GBPJPYb']
  const lotToTrade = 0.01;
  const cronExpression = '*/5 * * * *';

  const entropy = Entropy5.build({
    chatId: CHAT_ID,
    metaAccessToken: ACCESS_TOKEN,
    grammyBotToken: BOT_TOKEN,
  })

  const job = Job.schedule([
    {
      name: 'Entropy 5M',
      cronExpression,
      executor: () => entropy.exec(symbolToTrade, lotToTrade),
    }
  ])
}

run().catch(console.error);
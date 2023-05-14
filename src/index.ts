// import { ACCESS_TOKEN, BOT_TOKEN, CHAT_ID, PAIRS } from "./config";
// import { Job } from "./job";
// import { Entropy5RobotUsecase } from "./robot/entropy5/usecase";

// const EVERY_5_MINUTES = '*/1 * * * *';

// async function run() {
//   const riskAmountPerTrade = 1000;

//   const entropy = Entropy5RobotUsecase.build({
//     chatId: CHAT_ID,
//     metaAccessToken: ACCESS_TOKEN,
//     grammyBotToken: BOT_TOKEN,
//   })

//   Job.schedule([
//     {
//       name: 'Entropy 5M',
//       cronExpression: EVERY_5_MINUTES,
//       executor: () => entropy.exec({ symbols: PAIRS, riskAmountPerTrade }),
//     }
//   ])
// }

// run().catch(console.error);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const job_1 = require("./job");
const entropy5_1 = require("./robot/entropy5");
async function run() {
    const symbolToTrade = ['EURJPYb', 'EURUSDb', 'GBPJPYb'];
    const lotToTrade = 0.01;
    const cronExpression = '*/5 * * * *';
    const entropy = entropy5_1.Entropy5.build({
        chatId: config_1.CHAT_ID,
        metaAccessToken: config_1.ACCESS_TOKEN,
        grammyBotToken: config_1.BOT_TOKEN,
    });
    const job = job_1.Job.schedule([
        {
            name: 'Entropy 5M',
            cronExpression,
            executor: () => entropy.exec(symbolToTrade, lotToTrade),
        }
    ]);
}
run().catch(console.error);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Telegram = void 0;
class Telegram {
    client;
    chatId;
    constructor(client, chatId) {
        this.client = client;
        this.chatId = chatId;
    }
    static build(driver, config) {
        return new Telegram(driver.client, config.chatId);
    }
    async sendMessage(input) {
        const arrow = this.getArrow(input.type);
        const message = `
    ${arrow} ${input.type} Signal ${arrow}

    <strong>${input.type.toString()} ${input.symbol} now @ ${input.entry}</strong>

    Stoploss: ${input.stoploss} (-${input.risk})
    target: ${input.target} (+${input.reward})
    R/R: ${input.rewardToRiskRatio}
    
    ${(new Date()).toUTCString()}
    `;
        await this.client.api.sendMessage(this.chatId, message, { parse_mode: 'HTML' });
    }
    getArrow(type) {
        return type === 'BUY' ? '&#8679; &#8679; &#8679;' : '&#8681; &#8681; &#8681;';
    }
}
exports.Telegram = Telegram;

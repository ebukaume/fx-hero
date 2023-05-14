import { Bot } from "grammy";
import { TradeType } from "../account/trader";
import { logger } from "../util/logger";
import { Signal } from "../strategy/entropy";

export interface TelegramDriver {
  client: Bot;
}

export interface TelegramConfig {
  chatId: string;
}

export class Telegram {
  private constructor(private readonly client: Bot, private chatId: string) {}

  static build(driver: TelegramDriver, config: TelegramConfig): Telegram {
    return new Telegram(driver.client, config.chatId);
  }

  async sendSignal(input: Signal): Promise<void> {
    const arrow = this.getArrow(input.type);
    const message = `
    ${arrow} ${input.type} Signal ${arrow}

    <strong>${input.type.toString()} ${input.pair} @ ${input.entry}</strong>
    <em>
      <span class="tg-spoiler">Stoploss = ${input.stoploss} (${
      input.riskInPips
    } pips)</span>
      <span class="tg-spoiler">Target = ${input.target} (${
      input.rewardInPips
    } pips)</span>
      <span class="tg-spoiler">R:R = ${input.rewardToRiskRatio}</span>
    </em>
    ${new Date().toUTCString()}
    `;

    await this.client.api.sendMessage(this.chatId, message, {
      parse_mode: "HTML",
    });

    logger.info("Sent signal to Telegram", { input, chatId: this.chatId });
  }

  private getArrow(type: TradeType): string {
    return type === "BUY"
      ? "&#8679; &#8679; &#8679;"
      : "&#8681; &#8681; &#8681;";
  }
}

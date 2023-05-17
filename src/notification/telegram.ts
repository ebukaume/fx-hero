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

interface SignalInput extends Signal {
  lot: number;
  botName: string;
}

export class Telegram {
  private constructor(private readonly client: Bot, private chatId: string) {}

  static build(driver: TelegramDriver, config: TelegramConfig): Telegram {
    return new Telegram(driver.client, config.chatId);
  }

  async sendSignal(input: SignalInput): Promise<void> {
    const arrow = this.getArrow(input.type);
    const message = `
    ${arrow} ${input.type} Signal ${arrow}

    <strong>${input.type.toString()} ${input.pair} @ ${input.entry}</strong>
    <em>
      Bot = ${input.botName}
      Stoploss = ${input.stoploss} (${input.riskInPips} pips)
      Target = ${input.target} (${input.rewardInPips} pips)
      Lot = ${input.lot}
      R:R = ${input.rewardToRiskRatio}
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

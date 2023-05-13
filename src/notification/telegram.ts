import { Bot } from "grammy";
import { TradeType } from "../account/trader";
import { logger } from "../util/logger";
import { Symbol } from "../config";

export interface TelegramDriver {
  client: Bot
}

export interface TelegramConfig {
  chatId: string
}

export interface SignalInput {
  type: TradeType;
  symbol: Symbol;
  entry: number;
  stoploss: number;
  target: number;
  risk: number;
  reward: number;
  rewardToRiskRatio: number;
}

export class Telegram {
  private constructor(private readonly client: Bot, private chatId: string) { }

  static build(driver: TelegramDriver, config: TelegramConfig): Telegram {
    return new Telegram(driver.client, config.chatId)
  }

  async sendMessage(input: SignalInput): Promise<void> {
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

    logger.info('Notified Telegram Bot', { input, chatId: this.chatId });
  }

  private getArrow(type: TradeType): string {
    return type === 'BUY' ? '&#8679; &#8679; &#8679;' : '&#8681; &#8681; &#8681;'
  }
}

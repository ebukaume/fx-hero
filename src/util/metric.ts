import { logger } from "./logger";
import { Signal } from "../strategy/entropy";
import { TraderParam } from "../account/trader";

export class Metric {
  static countSignal(signal: Signal): void {
    logger.metric("Signal", { signal });
  }

  static countTrade(trade: TraderParam): void {
    logger.metric("Trade", { trade });
  }
}

import MetaApi, { RpcMetaApiConnectionInstance } from "metaapi.cloud-sdk";
import { logger } from "../util/logger";
import { Pair } from "../config";
import { Metric } from "../util/metric";
import { Lookup } from "../util/type";

interface TraderDriver {
  client: MetaApi;
}

export type TradeType = "BUY" | "SELL";

export interface TraderParam {
  type: TradeType;
  pair: Pair;
  lot: number;
  stoploss: number;
  target: number;
}

export class Trader {
  private connection!: RpcMetaApiConnectionInstance;
  private isConnected: boolean = false;

  private constructor(private client: MetaApi) {}

  static build(driver: TraderDriver): Trader {
    return new Trader(driver.client);
  }

  async open(param: TraderParam): Promise<string> {
    const { type, pair, lot, stoploss, target } = param;

    await this.connectToBroker();

    switch (type) {
      case "BUY":
        return this.buy(pair, lot, stoploss, target);
      case "SELL":
        return this.sell(pair, lot, stoploss, target);
      default:
        throw new Error("Unknown trade type");
    }
  }

  async close(orderIds: string[]): Promise<void> {
    await this.connectToBroker();

    const result = await Promise.all(
      orderIds.map((orderId) => this.connection.closePosition(orderId, {}))
    );
  }

  private async connectToBroker(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const account =
        await this.client.metatraderAccountApi.getAccountByToken();
      this.connection = account.getRPCConnection();

      await this.connection.connect();
      await this.connection.waitSynchronized();

      this.isConnected = true;
    } catch (error) {
      logger.error("Error connecting to the broker", { error });
    }
  }

  private disconnectFromBroker(): void {
    try {
      this.client.close();
      this.isConnected = false;
    } catch (error) {
      logger.error("Error disconnecting from the broker", { error });
    }
  }

  private async buy(
    pair: Pair,
    lot: number,
    stoploss: number,
    target: number
  ): Promise<string> {
    try {
      const result = await this.connection.createMarketBuyOrder(
        pair.toString(),
        lot,
        stoploss,
        target
      );

      logger.error(result.stringCode, {
        trade: { pair, lot, stoploss, target },
        result,
      });

      Metric.countTrade({ type: "BUY", pair, lot, stoploss, target });
      return result.orderId;
    } catch (error) {
      this.logError(error as Error, {
        type: "BUY",
        pair,
        lot,
        stoploss,
        target,
      });

      throw error;
    }
  }

  private async sell(
    pair: Pair,
    lot: number,
    stoploss: number,
    target: number
  ): Promise<string> {
    try {
      const result = await this.connection.createStopSellOrder(
        pair.toString(),
        lot,
        stoploss,
        target
      );

      logger.error(result.stringCode, {
        trade: { pair, lot, stoploss, target },
        result,
      });

      Metric.countTrade({ type: "SELL", pair, lot, stoploss, target });
      return result.orderId;
    } catch (error) {
      this.logError(error as Error, {
        type: "SELL",
        pair,
        lot,
        stoploss,
        target,
      });

      throw error;
    }
  }

  private logError(error: Error, meta: Lookup): void {
    logger.error(error.message, { meta });
  }
}

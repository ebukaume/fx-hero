import MetaApi, { RpcMetaApiConnectionInstance } from "metaapi.cloud-sdk";
import { logger } from "../util/logger";
import { Symbol } from "../config";

interface TraderDriver {
  client: MetaApi;
}

export type TradeType = "BUY" | "SELL";

interface TraderParam {
  type: TradeType;
  symbol: Symbol;
  lot: number;
  stoploss: number;
  target: number;
}

export class Trader {
  private connection!: RpcMetaApiConnectionInstance;

  private constructor(private client: MetaApi) {}

  static build(driver: TraderDriver): Trader {
    return new Trader(driver.client);
  }

  async open(param: TraderParam): Promise<string> {
    const { type, symbol, lot, stoploss, target } = param;

    await this.connectToBroker();

    switch (type) {
      case "BUY":
        return this.buy(symbol, lot, stoploss, target);
      case "SELL":
        return this.sell(symbol, lot, stoploss, target);
      default:
        throw new Error("Unknown trade type");
    }
  }

  async close(orderIds: string[]): Promise<void> {
    await this.connectToBroker();

    const result = await Promise.all(
      orderIds.map((orderId) => this.connection.closePosition(orderId, {}))
    );

    this.disconnectFromBroker();
  }

  private async connectToBroker(): Promise<void> {
    try {
      const account =
        await this.client.metatraderAccountApi.getAccountByToken();
      this.connection = account.getRPCConnection();

      await this.connection.connect();
      await this.connection.waitSynchronized();
    } catch (error) {
      logger.error("Error connecting to the broker", { error });
      process.exit(0);
    }
  }

  private disconnectFromBroker(): void {
    try {
      this.client.close();
    } catch (error) {
      logger.error("Error disconnecting from the broker", { error });
    }
  }

  private async buy(
    symbol: Symbol,
    lot: number,
    stoploss: number,
    target: number
  ): Promise<string> {
    const result = await this.connection.createMarketBuyOrder(
      symbol.toString(),
      lot,
      stoploss,
      target
    );
    this.disconnectFromBroker();

    if (result.stringCode === "ERR_NO_ERROR") {
      throw new Error(result.stringCode);
    }

    return result.orderId;
  }

  private async sell(
    symbol: Symbol,
    lot: number,
    stoploss: number,
    target: number
  ): Promise<string> {
    const result = await this.connection.createMarketSellOrder(
      symbol.toString(),
      lot,
      stoploss,
      target
    );
    this.disconnectFromBroker();

    if (result.stringCode === "ERR_NO_ERROR") {
      throw new Error(result.stringCode);
    }

    return result.orderId;
  }
}

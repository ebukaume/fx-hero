import MetaApi, { RpcMetaApiConnectionInstance } from "metaapi.cloud-sdk";
import { TradeType } from "./trader";
import { logger } from "../util/logger";
import { Pair } from "../config";

interface AccountManagementDriver {
  client: MetaApi;
}

interface AccountInformation {
  balance: number;
  equity: number;
  currency: string;
}

interface Position {
  id: number;
  type: TradeType;
  pair: Pair;
  openedAt: Date;
  updateAt: Date;
  openPrice: number;
  currentPrice: number;
  currentTickValue: number;
  stopLoss?: number;
  takeProfit?: number;
  volume: number;
  swap: number;
  profit: number;
  clientId?: string;
  commission: number;
  reason: string;
  brokerComment?: string;
}

export class AccountManagement {
  private connection!: RpcMetaApiConnectionInstance;

  private constructor(private client: MetaApi) {}

  static build({ client }: AccountManagementDriver): AccountManagement {
    return new AccountManagement(client);
  }

  async getAccountInformation(): Promise<AccountInformation> {
    await this.connectToBroker();

    const { balance, equity, currency } =
      await this.connection.getAccountInformation();
    this.disconnectFromBroker();

    return {
      balance,
      equity,
      currency,
    };
  }

  async getPositions(): Promise<Position[]> {
    await this.connectToBroker();

    const positions = await this.connection.getPositions();
    this.disconnectFromBroker();

    return positions.map(
      ({
        id,
        type,
        symbol: pair,
        time: openedAt,
        updateTime: updateAt,
        openPrice,
        currentPrice,
        currentTickValue,
        stopLoss,
        takeProfit,
        volume,
        swap,
        profit,
        clientId,
        commission,
        reason,
        brokerComment,
      }) => ({
        id,
        type: type === "POSITION_TYPE_BUY" ? "BUY" : "SELL",
        pair: pair as Pair,
        openedAt,
        updateAt,
        openPrice,
        currentPrice,
        currentTickValue,
        stopLoss,
        takeProfit,
        volume,
        swap,
        profit,
        clientId,
        commission,
        reason,
        brokerComment,
      })
    );
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
    }
  }

  private disconnectFromBroker(): void {
    try {
      this.client.close();
    } catch (error) {
      logger.error("Error disconnecting from the broker", { error });
    }
  }
}

import MetaApi, { RpcMetaApiConnectionInstance } from 'metaapi.cloud-sdk';
import { Symbol } from '../marketFeed/terminal';

interface TraderDriver {
  client: MetaApi
}

type TradeType = 'BUY' | 'SELL';

interface TraderParam {
  type: TradeType;
  symbol: Symbol;
  lot: number;
  stoploss: number;
  target: number;
}

export class Trader {
  private connection!: RpcMetaApiConnectionInstance;

  private constructor(
    private client: MetaApi,
  ) { }

  static build(driver: TraderDriver): Trader {
    return new Trader(driver.client);
  }

  async open(param: TraderParam): Promise<string> {
    const { type, symbol, lot, stoploss, target } = param;

    await this.connectToBroker()

    switch (type) {
      case 'BUY':
        return this.buy(symbol, lot, stoploss, target);
      case 'SELL':
        return this.sell(symbol, lot, stoploss, target);
      default:
        throw new Error('Unknown trade type');
    }
  }

  async close(orderIds: string[]): Promise<void> {
    await this.connectToBroker();

    const result = await Promise.all(orderIds.map(orderId => this.connection.closePosition(orderId, {})));

    await this.disconnectFromBroker();

    console.log({ result })
  }

  private async connectToBroker(): Promise<void> {
    const account = await this.client.metatraderAccountApi.getAccountByToken();
    this.connection = account.getRPCConnection();

    await this.connection.connect();
    await this.connection.waitSynchronized();
  }

  private async disconnectFromBroker(): Promise<void> {
    await this.client.close();
  }

  private async buy(symbol: Symbol, lot: number, stoploss: number, target: number): Promise<string> {
    const result = await this.connection.createMarketBuyOrder(symbol.toString(), lot, stoploss, target);
    this.client.close();

    if (result.stringCode === 'ERR_NO_ERROR') {
      throw new Error(result.stringCode)
    }

    return result.orderId
  }

  private async sell(symbol: Symbol, lot: number, stoploss: number, target: number): Promise<string> {
    const result = await this.connection.createMarketSellOrder(symbol.toString(), lot, stoploss, target);
    this.client.close();

    if (result.stringCode === 'ERR_NO_ERROR') {
      throw new Error(result.stringCode)
    }

    return result.orderId
  }
}

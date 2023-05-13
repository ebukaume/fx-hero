"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trader = void 0;
class Trader {
    client;
    connection;
    constructor(client) {
        this.client = client;
    }
    static build(driver) {
        return new Trader(driver.client);
    }
    async open(param) {
        const { type, symbol, lot, stoploss, target } = param;
        await this.connectToBroker();
        switch (type) {
            case 'BUY':
                return this.buy(symbol, lot, stoploss, target);
            case 'SELL':
                return this.sell(symbol, lot, stoploss, target);
            default:
                throw new Error('Unknown trade type');
        }
    }
    async close(orderIds) {
        await this.connectToBroker();
        const result = await Promise.all(orderIds.map(orderId => this.connection.closePosition(orderId, {})));
        await this.disconnectFromBroker();
        console.log({ result });
    }
    async connectToBroker() {
        const account = await this.client.metatraderAccountApi.getAccountByToken();
        this.connection = account.getRPCConnection();
        await this.connection.connect();
        await this.connection.waitSynchronized();
    }
    async disconnectFromBroker() {
        await this.client.close();
    }
    async buy(symbol, lot, stoploss, target) {
        const result = await this.connection.createMarketBuyOrder(symbol.toString(), lot, stoploss, target);
        this.client.close();
        if (result.stringCode === 'ERR_NO_ERROR') {
            throw new Error(result.stringCode);
        }
        return result.orderId;
    }
    async sell(symbol, lot, stoploss, target) {
        const result = await this.connection.createMarketSellOrder(symbol.toString(), lot, stoploss, target);
        this.client.close();
        if (result.stringCode === 'ERR_NO_ERROR') {
            throw new Error(result.stringCode);
        }
        return result.orderId;
    }
}
exports.Trader = Trader;

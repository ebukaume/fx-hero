"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventBus_1 = require("../eventBus");
describe('EventBus', () => {
    it('sends message to subscribers', () => {
        const handler = jest.fn();
        const bus = eventBus_1.EventBus.build();
        bus.subscribe('PRICE_FEED', handler);
        bus.publish('PRICE_FEED', 'TEST');
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith('TEST');
    });
    it('does not send message to non-subscribers', () => {
        const handler = jest.fn();
        const bus = eventBus_1.EventBus.build();
        bus.subscribe('PRICE_FEED', handler);
        bus.publish('TRADE_SIGNAL', 'TEST');
        expect(handler).not.toHaveBeenCalled();
    });
});

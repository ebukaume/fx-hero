import { EventBus } from "../eventBus";

describe('EventBus', () => {
  it('sends message to subscribers', () => {
    const handler = jest.fn();

    const bus = EventBus.build();
    bus.subscribe('PRICE_FEED', handler);
    bus.publish<string>('PRICE_FEED', 'TEST');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('TEST');
  });

  it('does not send message to non-subscribers', () => {
    const handler = jest.fn();

    const bus = EventBus.build();
    bus.subscribe('PRICE_FEED', handler);
    bus.publish<string>('TRADE_SIGNAL', 'TEST');

    expect(handler).not.toHaveBeenCalled();
  });
});

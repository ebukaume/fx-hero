type Topic = 'PRICE_FEED' | 'TRADE_SIGNAL'

export class EventBus {
  private subscriptions: Map<Topic, Function[]>;
  private static instance: EventBus;

  private constructor() {
    this.subscriptions = new Map<Topic, Function[]>();
  }

  static build(): EventBus {
    if (!this.instance) {
      this.instance = new EventBus();
    }

    return this.instance;
  }

  subscribe(topic: Topic, handle: Function): void {
    const subscribers = this.subscriptions.get(topic) ?? [];
    this.subscriptions.set(topic, [...subscribers, handle]);
  }

  publish<T>(topic: Topic, message: T): void {
    const subscribers = this.subscriptions.get(topic);

    if (!subscribers) {
      return;
    }

    subscribers.forEach(subscriber => subscriber(message))
  }
}

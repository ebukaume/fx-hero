"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
class EventBus {
    subscriptions;
    static instance;
    constructor() {
        this.subscriptions = new Map();
    }
    static build() {
        if (!this.instance) {
            this.instance = new EventBus();
        }
        return this.instance;
    }
    subscribe(topic, handle) {
        const subscribers = this.subscriptions.get(topic) ?? [];
        this.subscriptions.set(topic, [...subscribers, handle]);
    }
    publish(topic, message) {
        const subscribers = this.subscriptions.get(topic);
        if (!subscribers) {
            return;
        }
        subscribers.forEach(subscriber => subscriber(message));
    }
}
exports.EventBus = EventBus;

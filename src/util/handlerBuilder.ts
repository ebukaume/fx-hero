import type { ScheduledEvent } from "aws-lambda";

export type ScheduledLambdaHandler = (event: ScheduledEvent) => Promise<void>;

export class HandlerBuilder {
  static scheduledLambda(
    handler: (event: string) => Promise<void>
  ): ScheduledLambdaHandler {
    return async (event: ScheduledEvent) => {
      await handler(event.time);
    };
  }
}

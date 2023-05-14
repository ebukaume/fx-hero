import type { ScheduledEvent } from "aws-lambda";
import { Metric } from "./metric";
import { logger } from "./logger";

export type ScheduledLambdaHandler = (event: ScheduledEvent) => Promise<void>;

export class HandlerBuilder {
  static scheduledLambda(
    handler: (event: string) => Promise<void>
  ): ScheduledLambdaHandler {
    return async (event: ScheduledEvent) => {
      try {
        await handler(event.time);
      } catch (error) {
        logger.error((error as Error).message, { error });
      }
    };
  }
}

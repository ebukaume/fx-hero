import { Duration, NestedStack, type Stack } from "aws-cdk-lib";
import { CronOptions, Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { type IFunction } from "aws-cdk-lib/aws-lambda";
import { type BaseLambdaProps, CustomLambda } from "../component/lambda";
import { BaseStackProps } from "../config";
import { InfraUtil } from "../util";

export class RobotStack extends NestedStack {
  private readonly lambdas: CustomLambda[] = [];

  private constructor(
    private readonly scope: Stack,
    private readonly props: BaseStackProps
  ) {
    super(scope, RobotStack.name, {
      description: "FX Hero robots",
    });
  }

  static build(scope: Stack, props: BaseStackProps): RobotStack {
    return new RobotStack(scope, props).createLambdas();
  }

  private createLambdas(): RobotStack {
    this.createRobots();

    return this;
  }

  private createRobots(): void {
    const entropy5 = "entropy5";
    const entropy5Lambda = this.createLambda({
      name: entropy5,
      description: "Scalps M5 Heiken Ashi candle for quick profits",
      entry: InfraUtil.resolveRobotHandlerPath(entropy5),
      timeout: Duration.minutes(1),
      group: "robot",
    });

    const every4Hours: CronOptions = {
      minute: "*/5",
      hour: "6-15", // 6 AM to 3:55 PM
      weekDay: "2-6",
    };
    this.createSchedule(
      entropy5,
      entropy5Lambda.instance,
      Schedule.cron(every4Hours)
    );

    const macdTrendFollower = "macdTrendFollower";
    const macdTrendFollowerLambda = this.createLambda({
      name: macdTrendFollower,
      description: "Trades H1 Heiken Ashi candle with H4 trend",
      entry: InfraUtil.resolveRobotHandlerPath(macdTrendFollower),
      timeout: Duration.minutes(1),
      group: "robot",
    });

    const every1Hours: CronOptions = {
      minute: "*/15",
      weekDay: "2-6",
    };
    this.createSchedule(
      macdTrendFollower,
      macdTrendFollowerLambda.instance,
      Schedule.cron(every1Hours)
    );
  }

  private createSchedule(
    name: string,
    lambda: IFunction,
    schedule: Schedule
  ): void {
    const rule = new Rule(this.scope, `${name}-schedule`, {
      schedule,
    });

    rule.addTarget(new LambdaFunction(lambda, { retryAttempts: 0 }));
  }

  private createLambda(param: BaseLambdaProps): CustomLambda {
    const name = `${param.group}-${param.name}`;

    const lambda = new CustomLambda(this.scope, {
      ...param,
      name,
      config: this.props.config,
      env: {
        ...this.props.env,
      },
    });

    this.lambdas.push(lambda);

    return lambda;
  }
}

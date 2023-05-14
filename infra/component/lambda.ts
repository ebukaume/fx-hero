import { type Duration, type Stack } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Lookup } from '../../src/util/type';
import { BaseStackProps } from '../config';
import { ACCESS_TOKEN, BOT_TOKEN, CHAT_ID } from '../../src/config';

export interface BaseLambdaProps {
  name: string;
  description?: string;
  entry: string;
  memorySize?: number;
  timeout?: Duration;
  env?: Lookup<string>;
  group: 'robot';
}

type NewType = BaseStackProps & BaseLambdaProps;

export type LambdaProps = NewType;

export class CustomLambda {
  readonly instance: NodejsFunction;

  constructor(scope: Stack, props: LambdaProps) {
    const functionName = this.buildFunctionName(props);
    const { config: commonConfig } = props;

    this.instance = new NodejsFunction(scope, functionName, {
      functionName,
      description: props.description,
      entry: props.entry,
      runtime: commonConfig.lambda.runtime,
      timeout: props.timeout ?? commonConfig.lambda.timeout,
      memorySize: props.memorySize ?? commonConfig.lambda.memorySize,
      environment: {
        ACCESS_TOKEN,
        BOT_TOKEN,
        CHAT_ID,
        ...props.env,
      },
    });

    this.instance.addAlias(functionName);
  }

  addEnvironments(envs: Lookup<string, string>[]): CustomLambda {
    envs.forEach(({ key, value }) => this.instance.addEnvironment(key, value));

    return this;
  }

  private buildFunctionName(props: LambdaProps): string {
    return `${props.name}-fxn`;
  }
}

import { Duration, StackProps } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export const config = {
  region: 'eu-west-1',
  stack: {
    name: 'FX-Hero',
    description: 'Various forex robots',
  },
  lambda: {
    runtime: Runtime.NODEJS_18_X,
    timeout: Duration.minutes(15),
    memorySize: 128,
  },
} as const;

export type Config = typeof config;

export type BaseStackProps = {
  config: Config;
} & StackProps;

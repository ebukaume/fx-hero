import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RobotStack } from './robot';
import { BaseStackProps } from '../config';

export class FxHeroStack extends Stack {
  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    RobotStack.build(this, { ...props })
  }
}

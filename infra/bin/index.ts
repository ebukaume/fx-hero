#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { FxHeroStack } from "../stack/index";
import { config } from "../config";

const app = new App();
new FxHeroStack(app, config.stack.name, {
  config,
  description: config.stack.description,
});

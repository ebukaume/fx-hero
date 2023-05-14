import { join } from "path";

export class InfraUtil {
  static resolveRobotHandlerPath(robotName: string): string {
    return join(__dirname, "../src/robot", robotName, "index.ts");
  }
}

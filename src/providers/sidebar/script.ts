import { scriptState } from "./scripts/state";
import { scriptQuickRequest } from "./scripts/quickRequest";
import { scriptEnvHelpers } from "./scripts/envHelpers";
import { scriptRequestHandler } from "./scripts/requestHandler";
import { scriptNavigation } from "./scripts/navigation";
import { scriptRender } from "./scripts/render";
import { scriptInit } from "./scripts/init";

export function sidebarScript(): string {
  return [
    scriptState(),
    scriptQuickRequest(),
    scriptEnvHelpers(),
    scriptRequestHandler(),
    scriptNavigation(),
    scriptRender(),
    scriptInit(),
  ].join("\n");
}

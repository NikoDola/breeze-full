import { LIVE_ORIGIN } from "../../../cms/shared/contract";
import type { Env } from "./index";

// Live storage uses a separate Worker/configuration and independent credentials.
export const environmentEnabled = (env: Env) => env.CMS_ENVIRONMENT === "test" ||
  (env.CMS_ENVIRONMENT === "live" && env.CMS_UPLOAD_ORIGIN === LIVE_ORIGIN);

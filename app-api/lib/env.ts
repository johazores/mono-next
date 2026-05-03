export type AppEnv = "dev" | "production";

const VALID_ENVS: AppEnv[] = ["dev", "production"];

export function getAppEnv(): AppEnv {
  const raw = process.env.APP_ENV || "dev";
  if (!VALID_ENVS.includes(raw as AppEnv)) {
    throw new Error(
      `Invalid APP_ENV "${raw}". Must be one of: ${VALID_ENVS.join(", ")}`,
    );
  }
  return raw as AppEnv;
}

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  AUTOMATION_SECRET: z.string().min(32),
});

export function getServerEnv() {
  return serverEnvSchema.parse(process.env);
}

import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import postgres from "postgres";
import { logger } from "../utils/logging";
import { Secrets } from "@whiskey-platform/secrets";

export const db = async () => {
  const secrets = new Secrets();
  const connectionString = await secrets.get("DB_CONNECTION");
  logger.info("Connecting to database");
  const client = postgres(connectionString, { prepare: false });
  logger.info("Connection to database successful");
  return drizzle(client, { schema });
};

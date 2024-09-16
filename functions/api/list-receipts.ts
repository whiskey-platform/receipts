import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { db } from "../../db";
import { receipts, stores } from "../../db/schema";
import { eq } from "drizzle-orm";
import { apiGatewayAuth } from "@whiskey-platform/auth";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  let authError = apiGatewayAuth(event, async (user) => false);
  if (authError !== undefined) {
    return authError;
  }

  const dbClient = await db();

  const res = await dbClient
    .select()
    .from(receipts)
    .fullJoin(stores, eq(receipts.store_id, stores.id));
  return {
    statusCode: 200,
    body: JSON.stringify({
      res,
    }),
  };
};

import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { db } from "../../db";
import { receipts, stores } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { ulid } from "ulid";
import { DateTime } from "luxon";
import { S3Service } from "../../services/s3";
import { Resource } from "sst";
import { apiGatewayAuth } from "@whiskey-platform/auth";

const s3 = new S3Service();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  let authError = apiGatewayAuth(event, async (user) => false);
  if (authError !== undefined) {
    return authError;
  }

  const { storeName, timestamp, contentType } = JSON.parse(event.body);

  let id: string;
  let message: string;

  const dbClient = await db();

  const existing = await dbClient
    .select()
    .from(receipts)
    .leftJoin(stores, eq(stores.id, receipts.store_id))
    .where(
      and(
        eq(stores.name, storeName),
        eq(receipts.date, DateTime.fromMillis(timestamp).toJSDate())
      )
    );

  if (existing[0]) {
    // logger.info('Receipt exists. Will on only update document');
    id = existing[0].receipts.id;
    message = "Receipt exists, will update backing document.";
  } else {
    id = ulid(timestamp);

    // get store
    let storeID: number;
    try {
      const store = await dbClient.query.stores.findFirst({
        where: eq(stores.name, storeName),
      });
      storeID = store.id;
    } catch {}

    if (!storeID) {
      await dbClient.insert(stores).values({ name: storeName });
      const newStore = await dbClient.query.stores.findFirst({
        where: eq(stores.name, storeName),
      });
      storeID = newStore.id;
    }

    await dbClient
      .insert(receipts)
      .values({
        id,
        store_id: storeID,
        date: DateTime.fromMillis(timestamp).toJSDate(),
        documentType: "application/pdf",
      })
      .onConflictDoUpdate({
        target: receipts.id,
        set: {
          store_id: storeID,
          date: DateTime.fromMillis(timestamp).toJSDate(),
          documentType: "application/pdf",
        },
      });

    message = "Successfully saved receipt information";
  }

  const objectKey = s3.objectKey(id, contentType);
  const uploadUrl = await s3.getUploadLink(
    objectKey,
    Resource.ReceiptsBucket.name,
    contentType
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      message,
      receiptId: id,
      uploadUrl,
    }),
  };
};

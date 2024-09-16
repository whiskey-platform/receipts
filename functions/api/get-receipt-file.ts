import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { db } from "../../db";
import { receipts } from "../../db/schema";
import { eq } from "drizzle-orm";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Resource } from "sst";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { apiGatewayAuth } from "@whiskey-platform/auth";

const s3 = new S3Client({ region: "us-east-1" });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  let authError = apiGatewayAuth(event, async (user) => false);
  if (authError !== undefined) {
    return authError;
  }
  const { id } = event.pathParameters;
  const dbClient = await db();

  const receipt = await dbClient.query.receipts.findFirst({
    where: eq(receipts.id, id),
  });

  if (!receipt) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: "Receipt not found",
      }),
    };
  }

  const getFile = new GetObjectCommand({
    Bucket: Resource.ReceiptsBucket.name,
    Key: `${receipt.id}.pdf`,
  });

  const url = await getSignedUrl(s3, getFile, { expiresIn: 3600 });

  return {
    statusCode: 200,
    body: JSON.stringify({
      id,
      url,
    }),
  };
};

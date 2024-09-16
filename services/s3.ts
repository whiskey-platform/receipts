import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { extension } from "mime-types";

export class S3Service {
  objectKey = (id: string, contentType: string): string =>
    `${id}.${extension(contentType)}`;

  public async getUploadLink(
    Key: string,
    Bucket: string,
    ContentType: string
  ): Promise<string> {
    const request = new PutObjectCommand({
      Bucket,
      Key,
      ContentType,
    });
    //Logger.info('Request to S3', { request });

    const url = await getSignedUrl(
      new S3Client({ region: process.env.AWS_REGION }),
      request,
      {
        expiresIn: 3600,
      }
    );
    //Logger.info('Request to S3 successful', { uploadURL: url });
    return url;
  }
}

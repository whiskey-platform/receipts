/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    "API": {
      "type": "sst.aws.ApiGatewayV2"
      "url": string
    }
    "ReceiptsBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
  }
}
export {}

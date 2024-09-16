/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "receipts",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const bucket = new sst.aws.Bucket("ReceiptsBucket", {
      transform: {
        bucket: (args, opts) => {
          if ($app.stage === "prod") {
            args.bucket =
              "prod-whiskey-receipts-serv-receiptsbucket90475616-pj7yglpgs6sk";
            args.forceDestroy = undefined;

            opts.import =
              "prod-whiskey-receipts-serv-receiptsbucket90475616-pj7yglpgs6sk";
          }
        },
      },
    });

    const api = new sst.aws.ApiGatewayV2("API", {
      domain: !$dev
        ? {
            name: `api${
              $app.stage !== "prod" ? `.${$app.stage}` : ""
            }.whiskey.mattwyskiel.com`,
            dns: false,
            path: "receipts",
            cert: process.env.CERT_ARN,
          }
        : undefined,
    });
    api.route("GET /", "functions/api/list-receipts.handler");
    api.route("GET /{id}/file", {
      handler: "functions/api/get-receipt-file.handler",
      link: [bucket],
    });
    api.route("POST /", {
      handler: "functions/api/upload-receipt.handler",
      link: [bucket],
    });
  },
});

import { config, S3 } from "aws-sdk";
import { env } from "../env/server.mjs";

config.update({
  accessKeyId: process.env.AWS_ACCESSKEY,
  secretAccessKey: process.env.AWS_SECRETKEY,
  region: process.env.AWS_REGION,
  signatureVersion: "v4",
});

declare global {
  // eslint-disable-next-line no-var
  var s3: S3 | undefined;
}

export const s3 =
  global.s3 ||
  new S3({
    accessKeyId: process.env.AWS_ACCESSKEY,
    secretAccessKey: process.env.AWS_SECRETKEY,
    region: process.env.AWS_REGION,
    signatureVersion: "v4",
  });

if (env.NODE_ENV !== "production") {
  global.s3 = s3;
}

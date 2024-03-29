import { ImageResponse } from "@vercel/og";
import { createQueryValidator } from "helpers/query-validator";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const config = {
  runtime: "edge",
};

const validator = createQueryValidator(
  z.object({
    width: z.number(),
    src: z.string().url(),
  })
);

export default async function (req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const { width, src } = validator.validate(searchParams);

  return new ImageResponse(
    (
      <div
        tw="aspect-square"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: !src ? "black" : "",
        }}
      >
        {src && <img tw="object-cover aspect-square" src={src} />}
      </div>
    ),
    {
      width,
    }
  );
}

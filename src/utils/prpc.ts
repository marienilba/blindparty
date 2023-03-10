import { AppRouter } from "../server/api/root";
import { api } from "./api";
import { createPRPCNext } from "@prpc/client";
import { PRPCRouter } from "server/api/prpc";

const ap = api.party;
export const prpc = createPRPCNext<AppRouter["party"], PRPCRouter>(api.party, {
  app_key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  options: {
    authEndpoint: "/api/prpc/",
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  },
  log: process.env.NODE_ENV !== "production" && typeof window !== "undefined",
});

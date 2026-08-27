import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";

const app = express();

app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ limit: "12mb", extended: true }));

// `/manus-storage/*` is rewritten here by vercel.json so the existing
// storage proxy continues to serve uploaded archive images on Vercel.
app.use((req, _res, next) => {
  if (req.url.startsWith("/api/manus-storage/")) {
    req.url = req.url.slice(4);
  }
  next();
});

registerStorageProxy(app);
registerOAuthRoutes(app);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

export default app;

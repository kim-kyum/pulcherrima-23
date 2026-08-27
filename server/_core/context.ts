import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { createAdminUser, getAdminSession, type AdminSession } from "../adminAuth";
import { getAdminAccountById } from "../adminAccounts";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  adminSession: AdminSession | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let adminSession: AdminSession | null = null;

  try {
    adminSession = getAdminSession(opts.req);
    if (adminSession) {
      if (adminSession.accountId > 0) {
        const account = await getAdminAccountById(adminSession.accountId);
        if (!account || !account.active || account.role !== adminSession.role || account.username !== adminSession.username) {
          adminSession = null;
        }
      }
      if (adminSession) user = createAdminUser(adminSession);
    } else {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    adminSession,
  };
}

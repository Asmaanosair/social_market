import { type Session } from "next-auth";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export interface Context {
  session: Session | null;
  db: typeof db;
}

export async function createContext(): Promise<Context> {
  const session = await auth();
  return {
    session,
    db,
  };
}

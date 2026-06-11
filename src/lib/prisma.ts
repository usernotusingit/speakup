import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function resolveDbUrl(): string {
  const url = process.env.DATABASE_URL!;
  if (url.startsWith("file:")) {
    const filePath = url.slice(5);
    if (!path.isAbsolute(filePath)) {
      return `file:${path.resolve(process.cwd(), filePath)}`;
    }
  }
  return url;
}

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url: resolveDbUrl() });
  return new PrismaClient({ adapter, log: ["error"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

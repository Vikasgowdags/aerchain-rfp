// backend/src/db.js
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

console.log("🔥 Prisma client initialized");


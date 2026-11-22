import { PrismaClient } from '@prisma/client';

// One shared database client for the whole server.
// Previously each route file created its own PrismaClient, which opened
// several separate connection pools and competed for the small database.
export const prisma = new PrismaClient();
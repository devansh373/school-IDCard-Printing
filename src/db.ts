// import { PrismaClient } from "./generated/prisma/client.js";
// import { PrismaPg } from "@prisma/adapter-pg";
// const connectionString = `${process.env.DATABASE_URL}`;

// const adapter = new PrismaPg({ connectionString });
// const prisma = new PrismaClient({
//   adapter,

// });

// export default prisma;

import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import pg from 'pg'

const connectionString = `${process.env.DATABASE_URL}`

// Configure connection pool with limits to prevent excessive CPU usage
const pool = new pg.Pool({
    connectionString,
    max: 10,                   // Maximum 10 connections (default is unlimited)
    idleTimeoutMillis: 30000,  // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Timeout new connections after 10 seconds
    allowExitOnIdle: true,     // Allow the process to exit when pool is idle
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export { prisma }
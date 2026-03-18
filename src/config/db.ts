import { PrismaClient } from "../../prisma/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { envConfig } from "./envConfig.js";

const adapter = new PrismaPg({
  connectionString: envConfig.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter, 
  errorFormat: "pretty"
 });

export default prisma;
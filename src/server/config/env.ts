// @ts-nocheck
import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MELDEMCP_SERVER_PORT: z.string().default('3000'),
    MELDEMCP_ERP_BASE_URL: z.string().url().describe('The base URL for the Meldep ERP API.'),
});
export const env = envSchema.parse(process.env);

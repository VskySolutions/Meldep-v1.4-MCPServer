// @ts-nocheck
import { z } from 'zod';
import { HttpClient } from '../client/http-client.js';
import { ERP_ENDPOINTS } from '../client/endpoints.js';
import { meldepConfig } from '../config/meldep.config.js';
import { tokenManager } from './token-manager.js';
import { sessionStore } from './session-store.js';
const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};
// Define the schema for the login request body
export const LoginRequestSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    isRememberMeChecked: z.boolean().default(true),
});
// Define the schema for the successful login response
const LoginResponseObjectSchema = z.object({
    token: z.string(),
    expiresIn: z.number(),
    createdAt: z.string(),
    username: z.string(),
    personId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    userEmail: z.string(),
    employeeId: z.string(),
    roles: z.array(z.string()),
    rolesName: z.array(z.string()).optional(),
    siteId: z.string(),
    userId: z.string(),
    siteName: z.string(),
    globalSiteId: z.string().optional(),
    siteTimeZone: z.string().optional(),
    siteLandingPageLink: z.string().optional(),
    isMsLogin: z.boolean().optional(),
});
// Accept either a single object or an array of objects and normalize to array below
export const LoginResponseSchema = z.union([LoginResponseObjectSchema, z.array(LoginResponseObjectSchema)]);
export async function login(credentials) {
    try {
        const httpClient = new HttpClient(meldepConfig.baseURL);
        const response = await httpClient.post(ERP_ENDPOINTS.AUTH.LOGIN, credentials);
        const parsed = LoginResponseSchema.parse(response.data);
        const parsedResponse = Array.isArray(parsed) ? parsed : [parsed];
        if (parsedResponse.length > 0) {
            const authData = parsedResponse[0];
            tokenManager.setToken(authData.token, authData.expiresIn);
            sessionStore.set('username', authData.username);
            sessionStore.set('personId', authData.personId);
            sessionStore.set('firstName', authData.firstName);
            sessionStore.set('lastName', authData.lastName);
            sessionStore.set('email', authData.userEmail);          
            sessionStore.set('employeeId', authData.employeeId);
            sessionStore.set('roles', authData.roles);
            sessionStore.set('rolesName', authData.rolesName ?? []);
            sessionStore.set('siteId', authData.siteId);
            sessionStore.set('userId', authData.userId);
            sessionStore.set('siteName', authData.siteName);
            sessionStore.set('globalSiteId', authData.globalSiteId ?? '');
            sessionStore.set('siteLandingPage', authData.siteLandingPageLink ?? '/dashboard');
            sessionStore.set('siteTimezone', authData.siteTimeZone ?? 'India Standard Time'); 
            logger.info('User logged in successfully: %s', authData.username);
            return true;
        }
        logger.warn('Login failed: No authentication data in response.');
        return false;
    }
    catch (error) {
        logger.error({ error }, 'Login failed due to an error.');
        return false;
    }
}

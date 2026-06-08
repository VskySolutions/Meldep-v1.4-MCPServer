// @ts-nocheck
import { z } from 'zod';
// import { Tool } from '@modelcontextprotocol/sdk';
import { login, LoginRequestSchema } from '../../auth/login.js';
import { sessionStore } from '../../auth/session-store.js';
const logger = {
    info: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
};
const ConnectMeldepInputSchema = LoginRequestSchema.extend({
    projectId: z.string().describe('The ID of the project to associate with the session.'),
});
async function executeConnectMeldepTool(input) {
    const { username, password, projectId } = input;
    try {
        const isAuthenticated = await login({ username, password, isRememberMeChecked: true });
        if (isAuthenticated) {
            sessionStore.set('projectId', projectId);
            return {
                success: true,
                message: `Successfully connected to Meldep ERP for user ${username} and project ${projectId}.`,
            };
        }
        else {
            return {
                success: false,
                message: 'Authentication failed. Please check your credentials.',
            };
        }
    }
    catch (error) {
        logger.error({ error }, 'Error connecting to Meldep ERP.');
        return {
            success: false,
            message: `An unexpected error occurred: ${error.message}`,
        };
    }
}
export const connectMeldepTool = {
    name: 'connect_meldep',
    description: 'Connects to the Meldep ERP system using provided credentials and sets the active project ID.',
    inputSchema: {
        type: 'object',
        properties: {
            username: { type: 'string', description: 'Username for Meldep ERP login' },
            password: { type: 'string', description: 'Password for Meldep ERP login' },
            projectId: { type: 'string', description: 'The ID of the project to associate with the session.' },
        },
        required: ['username', 'password', 'projectId'],
    },
};
export async function executeConnectMeldepToolHandler(input) {
    return executeConnectMeldepTool(input);
}

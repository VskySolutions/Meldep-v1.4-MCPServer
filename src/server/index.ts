#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { getMonthlyPlanTool, executeGetMonthlyPlanToolHandler, } from './tools/monthly-plan/get-monthly-plans.tool.js';
import { getWeeklyPlanTool, executeGetWeeklyPlanToolHandler, } from './tools/weekly-plan/get-weekly-plans.tool.js';
import { getAllRequirementsByProjectTool, executeGetAllRequirementsByProjectToolHandler, } from './tools/requirement/get-all-requirements-by-project.tool.js';
import { executeGetTaskByTaskNumberToolHandler, getTaskByTaskNumberTool } from './tools/task/get-task-by-task-number.tool.js';
import { login } from './auth/login.js';
import {
    getTimesheetDataByDateRangeTool,
    executeGetTimesheetDataByDateRangeToolHandler,
} from './tools/timesheet/get-timesheet-data-by-daterange.tool.js';
import { sessionStore } from './auth/session-store.js';
/**
 * IMPORTANT:
 * MCP servers MUST NOT write to stdout.
 * stdout is reserved for MCP protocol communication.
 *
 * Therefore we redirect all logs to stderr.
 */
interface ToolHandler {
    (input: any): Promise<any>;
}

interface ToolHandlers {
    [key: string]: ToolHandler;
}

const logger = {
    info: (...args: any[]) => console.error(...args),
    error: (...args: any[]) => console.error(...args),
};

const tools = [getMonthlyPlanTool, getWeeklyPlanTool, getAllRequirementsByProjectTool, getTaskByTaskNumberTool, getTimesheetDataByDateRangeTool];
const toolHandlers: ToolHandlers = {
    get_monthly_plan: executeGetMonthlyPlanToolHandler,
    get_weekly_plan: executeGetWeeklyPlanToolHandler,
    get_all_requirements_by_project: executeGetAllRequirementsByProjectToolHandler,
    get_task_by_task_number: executeGetTaskByTaskNumberToolHandler,
    [getTimesheetDataByDateRangeTool.name]: executeGetTimesheetDataByDateRangeToolHandler,
};
const parseCommandLineArgs = () => {
    const args = process.argv.slice(2);
    let username = '';
    let password = '';
    let projectId = '';
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--username' && i + 1 < args.length) {
            username = args[i + 1];
            i++;
        }
        else if (args[i] === '--password' && i + 1 < args.length) {
            password = args[i + 1];
            i++;
        }
        else if (args[i] === '--projectId' && i + 1 < args.length) {
            projectId = args[i + 1];
            i++;
        }
    }
    if (!username || !password || !projectId) {
        throw new Error('Missing required arguments.\n' +
            'Usage:\n' +
            'npm run dev -- --username <username> --password <password> --projectId <projectId>');
    }
    return {
        username,
        password,
        projectId,
    };
};
const startServer = async () => {
    try {
        logger.error('Starting Meldep MCP Server...');
        /**
         * Parse CLI arguments
         */
        const { username, password, projectId } = parseCommandLineArgs();
        logger.error(`Authenticating user: ${username}`);
        /**
         * Authenticate
         */
        const isAuthenticated = await login({
            username,
            password,
            isRememberMeChecked: true,
        });
        if (!isAuthenticated) {
            throw new Error('Authentication failed. Please check your credentials.');
        }
        logger.error('Authentication successful');
        /**
         * Store project ID
         */
        sessionStore.set('projectId', projectId);
        // sessionStore.set('userId', username);
        logger.error('Storing project ID: %s', projectId);
        /**
         * Create MCP server
         */
        const server = new Server({
            name: 'meldep-mcp',
            version: '1.0.2',
        }, {
            capabilities: {
                tools: {},
            },
        });
        /**
         * List available tools
         */
        server.setRequestHandler(ListToolsRequestSchema, async () => {
            logger.error('Listing tools');
            return {
                tools,
            };
        });
        /**
         * Handle tool calls
         */
        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            logger.error(`Tool called: ${name}`);
            const handler = toolHandlers[name];
            if (!handler) {
                throw new Error(`Unknown tool: ${name}`);
            }
            try {
                const result = await handler(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                logger.error({
                    error,
                }, `Error while executing tool: ${name}`);
                throw error;
            }
        });
        /**
         * Connect MCP stdio transport
         */
        const transport = new StdioServerTransport();
        await server.connect(transport);
        logger.error('Meldep MCP Server started successfully');
        /**
         * Keep process alive
         */
        process.stdin.resume();
        /**
         * Graceful shutdown
         */
        process.on('SIGINT', async () => {
            logger.error('Received SIGINT. Shutting down...');
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            logger.error('Received SIGTERM. Shutting down...');
            process.exit(0);
        });
    }
    catch (error) {
        logger.error({
            error,
        }, 'Fatal error while starting MCP server');
        /**
         * IMPORTANT:
         * Delay exit slightly so Claude can capture logs.
         */
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
};
startServer().catch((error) => {
    logger.error({
        error,
    }, 'Unhandled startup error');
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

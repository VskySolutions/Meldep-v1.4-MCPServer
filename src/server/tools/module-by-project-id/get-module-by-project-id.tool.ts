// @ts-nocheck
import { meldepClient } from '../../client/meldep-client.js';
import { mapModulesByProjectIdResponse } from './mappers/module-by-project-id.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

// 1. Accept projectId as an argument instead of drawing from sessionStore
async function executeGetModuleByProjectIdTool({ projectId }) {
    if (!projectId) {
        return { isError: true, message: 'Project ID is required.', data: null };
    }

    try {
        const rawData = await meldepClient.getModulesByProjectId(projectId);
        const mapped = mapModulesByProjectIdResponse(rawData);

        return {
            isError: false,
            message: `Modules retrieved successfully for project: ${projectId}`,
            data: mapped,
        };
    } catch (error) {
        logger.error({ error }, 'Error fetching modules by project ID.');
        return {
            isError: true,
            message: `Failed to retrieve modules: ${error.message}`,
            data: null,
        };
    }
}

// 2. Add projectId to the tool schema definition
export const getModuleByProjectIdTool = {
    name: 'get_module_by_project_id',
    description: `Retrieves the list of modules for a specified project ID from Meldep ERP.
Use this tool when the user provides or asks about a specific project ID, for example:
- "Show modules for project PRJ-001"
- "List modules under project ID 12345"`,
    inputSchema: {
        type: 'object',
        properties: {
            projectId: {
                type: 'string',
                description: 'The unique identifier/ID of the project to retrieve modules for.'
            }
        },
        required: ['projectId'], 
    },
};

// 3. Ensure the handler passes down the arguments object received from the MCP Server request
export async function executeGetModuleByProjectIdToolHandler(args) {
    return executeGetModuleByProjectIdTool(args);
}
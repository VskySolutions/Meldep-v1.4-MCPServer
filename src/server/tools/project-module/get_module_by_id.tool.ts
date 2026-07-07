// @ts-nocheck

import { z } from 'zod';
import { meldepClient } from '../../client/meldep-client.js';
import { mapModuleByIdResponse } from './mappers/get_module_by_id.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

const GetModuleByIdInputSchema = z.object({
    moduleId: z
        .string()
        .min(1)
        .describe(
            'Module ID to retrieve requirements and tasks'
        ),
});

async function executeGetModuleByIdTool(input) {

    const { moduleId } = input;

    if (!moduleId) {
        return {
            isError: true,
            message: 'Module ID is required.',
            data: null,
        };
    }

    try {

        const rawRequirements =
            await meldepClient.getModuleById(moduleId);

        const mappedResponse =
            mapModuleByIdResponse(
                rawRequirements,
                moduleId
            );

        return {
            isError: false,
            message:
                'Module details retrieved successfully.',
            data: mappedResponse,
        };

    } catch (error) {

        logger.error(
            { error },
            'Error fetching module details'
        );

        return {
            isError: true,
            message:
                `Failed to retrieve module details: ${error.message}`,
            data: null,
        };
    }
}

export const getModuleByIdTool = {

    name: 'get_module_by_id',

    description: `Retrieves complete module details including requirements, tasks and summary counts.

Use to retrieve module information by Module ID.

Args:
    moduleId (str): Module UUID.

Response:
{
    "moduleId": "...",
    "moduleName": "...",

    "summary": {
        "totalRequirements": 3,
        "totalTasks": 8,
        "openTasks": 5,
        "inDevelopmentTasks": 3
    },

    "requirements": [...]
}`,

    inputSchema: {
        type: 'object',

        properties: {
            moduleId: {
                type: 'string',
                description:
                    'Module UUID to retrieve details',
            },
        },

        required: ['moduleId'],
    },
};

export async function executeGetModuleByIdToolHandler(
    input,
) {
    return executeGetModuleByIdTool(input);
}
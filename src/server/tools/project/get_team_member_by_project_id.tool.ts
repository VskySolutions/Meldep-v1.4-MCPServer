// @ts-nocheck

import { z } from 'zod';
import { meldepClient } from '../../client/meldep-client.js';
import { mapProjectTeamMembersResponse } from './mappers/get_team_member_by_project_id.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

const GetTeamMembersInputSchema = z.object({
    projectId: z
        .string()
        .min(1)
        .describe('Project ID to retrieve all team members'),
});

async function executeGetTeamMembersByProjectIdTool(input) {

    const { projectId } = input;

    if (!projectId) {
        return {
            isError: true,
            message: 'Project ID is required.',
            data: [],
        };
    }

    try {

        const rawProject =
            await meldepClient.getTeamMembersByProjectId(projectId);

        logger.info(
            { rawProject },
            'Project team member response before mapping'
        );

        const mappedResponse =
            mapProjectTeamMembersResponse(rawProject);

        return {
            isError: false,
            message: 'Project team members retrieved successfully.',
            data: mappedResponse,
        };

    } catch (error) {

        logger.error(
            { error },
            'Error fetching team members'
        );

        return {
            isError: true,
            message: `Failed to retrieve team members: ${error.message}`,
            data: [],
        };
    }
}

export const getTeamMembersByProjectIdTool = {
    name: 'get_team_member_by_project_id',

    description: `Retrieves all team members assigned to a specific project, including employee details and project roles.

Use to retrieve team members assigned to a project.

Args:
    project_id (str): Project UUID (e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).

Response:
{
    "isError": false,
    "message": "Project team members retrieved successfully.",
    "data": [
        {
            "employeeId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            "employeeName": "John Doe",
            "role": "Intern"
        }
    ]
}`,

    inputSchema: {
        type: 'object',

        properties: {
            projectId: {
                type: 'string',
                description:
                    'Project UUID to fetch assigned team members',
            },
        },

        required: ['projectId'],
    },
};

export async function executeGetTeamMembersByProjectIdToolHandler(
    input,
) {
    return executeGetTeamMembersByProjectIdTool(input);
}
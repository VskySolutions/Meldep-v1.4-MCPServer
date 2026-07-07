// @ts-nocheck
import { z } from 'zod';
import { meldepClient } from '../../client/meldep-client.js';
import { mapProjectListResponse } from './mappers/get_project_list.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

const GetProjectListInputSchema = z.object({
    status: z
        .enum([
            'Cancelled',
            'Completed',
            'In progress',
            'New',
            'On Hold',
            'Open',
        ])
        .optional()
        .describe('Optional project status filter.'),

    priority: z
        .enum(['High', 'Medium', 'Low'])
        .optional()
        .describe('Optional project priority filter.'),

    searchText: z
        .string()
        .optional()
        .describe('Optional keyword search text for project name.'),

    activeStatus: z
        .enum(['Active', 'All', 'Inactive'])
        .optional()
        .describe('Optional active/inactive filter.'),
});

async function executeGetProjectListTool(input) {
    try {
        const validatedInput = GetProjectListInputSchema.parse(input || {});

        const payload = {
            page: 1,
            pageSize: 100,
            sortBy: 'name',
            sorts: {},
            descending: false,
            searchText: validatedInput.searchText || '',
            activeStatus: null,
        };

        const rawProjectData = await meldepClient.getProjectList(payload);

        logger.info(
            { rawProjectData },
            'Project list raw response before mapping'
        );

        const aiFriendlyProjects = mapProjectListResponse(
            rawProjectData,
            validatedInput
        );

        return {
            isError: false,
            message: 'Project list retrieved successfully.',
            appliedFilters: {
                status: validatedInput.status || 'All',
                priority: validatedInput.priority || 'All',
                searchText: validatedInput.searchText || '',
                activeStatus: validatedInput.activeStatus || 'All',
            },
            totalProjects: aiFriendlyProjects.length,
            data: aiFriendlyProjects,
        };

    } catch (error) {
        logger.error({ error }, 'Error fetching project list.');

        return {
            isError: true,
            message: `Failed to retrieve project list: ${error.message}`,
            data: [],
        };
    }
}

export const getProjectListTool = {
    name: 'get_project_list',

    description: `Retrieves the list of projects from Meldep.

Use this tool when the user wants to view available project names based on status, priority, keyword search, or active/inactive status.

Args:
    status (str, optional): Project status. Allowed values: Cancelled, Completed, In progress, New, On Hold, Open.
    priority (str, optional): Project priority. Allowed values: High, Medium, Low.
    searchText (str, optional): Keyword search text for project name.
    activeStatus (str, optional): Active filter. Allowed values: Active, All, Inactive.

Response:
{
    "isError": false,
    "message": "Project list retrieved successfully.",
    "appliedFilters": {
        "status": "Completed",
        "priority": "High",
        "searchText": "",
        "activeStatus": "Inactive"
    },
    "totalProjects": 0,
    "data": []
}`,

    inputSchema: {
        type: 'object',
        properties: {
            status: {
                type: 'string',
                enum: [
                    'Cancelled',
                    'Completed',
                    'In progress',
                    'New',
                    'On Hold',
                    'Open',
                ],
                description: 'Optional: Filter projects by status.',
            },
            priority: {
                type: 'string',
                enum: ['High', 'Medium', 'Low'],
                description: 'Optional: Filter projects by priority.',
            },
            searchText: {
                type: 'string',
                description: 'Optional: Keyword search text for project name.',
            },
            activeStatus: {
                type: 'string',
                enum: ['Active', 'All', 'Inactive'],
                description: 'Optional: Filter by Active, Inactive, or All.',
            },
        },
        required: [],
    },
};

export async function executeGetProjectListToolHandler(input) {
    return executeGetProjectListTool(input);
}
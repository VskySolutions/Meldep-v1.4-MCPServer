// @ts-nocheck
import { meldepClient } from '../../client/meldep-client.js';
import { mapProjectListResponse } from './mappers/get-project-id.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

// 1. Accept a searchText keyword instead of an already-known project ID
async function executeGetProjectIdTool({ searchText, page, pageSize }) {
    if (!searchText || !searchText.trim()) {
        return { isError: true, message: 'searchText (project name or keyword) is required.', data: null };
    }

    const payload = {
        page: page ?? 1,
        pageSize: pageSize ?? 20,
        sortBy: '',
        descending: false,
        sorts: {},
        searchText: searchText.trim(),
    };

    try {
        const rawData = await meldepClient.getProjectList(payload);
        const mapped = mapProjectListResponse(rawData);

        if (mapped.length === 0) {
            return {
                isError: false,
                message: `No projects found matching "${searchText}".`,
                data: [],
            };
        }

        return {
            isError: false,
            message: `Found ${mapped.length} project(s) matching "${searchText}".`,
            data: mapped,
        };
    } catch (error) {
        logger.error({ error }, 'Error fetching project list by keyword.');
        return {
            isError: true,
            message: `Failed to retrieve project ID: ${error.message}`,
            data: null,
        };
    }
}

// 2. Tool schema definition
export const getProjectIdTool = {
    name: 'get_project_id',
    description: `Retrieves project IDs and basic details from Meldep ERP by performing a keyword search against project names.

Use when you need to resolve a project name (full or partial) into its unique system ID before performing other operations.

Args:
- searchText: The keyword or (partial) name of the project to search for.
- page: (Optional) Page number for pagination. Defaults to 1.
- pageSize: (Optional) Number of results per page. Defaults to 20.

Response:
{
  "isError": false,
  "message": "Found 1 project(s) matching \"hlda\".",
  "data": [
    {
      "projectId": "CEA7C6EA-53D4-4807-86D9-B720EC0528FE",
      "projectName": "HLDA (Heather Loveland Dance Academy)"
    }
  ]
}`,
    inputSchema: {
        type: 'object',
        properties: {
            searchText: {
                type: 'string',
                description: 'Keyword or (partial) name of the project to search for, e.g. "Bader Rutter" or "Marcum".'
            },
            page: {
                type: 'number',
                description: 'Page number for pagination. Defaults to 1.'
            },
            pageSize: {
                type: 'number',
                description: 'Number of results per page. Defaults to 20.'
            }
        },
        required: ['searchText'],
    },
};

// 3. Handler passes down the arguments object received from the MCP Server request
export async function executeGetProjectIdToolHandler(args) {
    return executeGetProjectIdTool(args);
}

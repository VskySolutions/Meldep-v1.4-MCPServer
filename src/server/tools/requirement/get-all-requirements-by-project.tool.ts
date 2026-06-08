// @ts-nocheck
import { z } from 'zod';
import { meldepClient } from '../../client/meldep-client.js'; // Use .js for runtime import
import { sessionStore } from '../../auth/session-store.js';
import { mapRequirementResponse } from './mappers/requirement.mapper.js'; // Use .js for runtime import
const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};
const GetAllRequirementsByProjectInputSchema = z.object({
    page: z
        .number()
        .int()
        .min(1, 'page cannot be less than 1.')
        .describe('The page number for pagination.'),
    pageSize: z
        .number()
        .int()
        .min(1, 'pageSize cannot be less than 1.')
        .max(20, 'pageSize cannot exceed 20. You can ask for a maximum of 20 records at a time.')
        .describe('The number of records to take per page.'),
    sortBy: z
        .string()
        .optional()
        .describe('The field to sort the requirements by. Defaults to "status.dropDownValue".'),
    descending: z
        .boolean()
        .optional()
        .describe('Whether to sort in descending order. Defaults to false.'),
    searchText: z
        .string()
        .optional()
        .describe('Text to search within requirements.'),
    requirementNumber: z
        .string()
        .optional()
        .describe('Specific requirement number to search for. Defaults to "0".'),
    // Note: projectModuleIds, requirementGroupIds, name, requirementType, statusIds,
    // identifiedByIds, fromDate, toDate, requirementTagIds are not included for brevity
    // and to focus on core AI-friendly transformation. These can be added if required
    // for more advanced filtering in the future.
});
async function executeGetAllRequirementsByProjectTool(input) {
    const { page, pageSize, sortBy, descending, searchText, requirementNumber } = input;
    const projectId = sessionStore.getProjectId();
    if (!projectId) {
        return {
            isError: true,
            message: 'Project ID not found in session.',
            data: [],
        };
    }
    // Zod schema handles most validation, but explicit checks match original tool style for clarity
    if (page < 1) {
        return {
            isError: true,
            message: 'page cannot be less than 1.',
            data: [],
        };
    }
    if (pageSize < 1 || pageSize > 20) {
        return {
            isError: true,
            message: 'pageSize must be between 1 and 20. You can ask for a maximum of 20 records at a time.',
            data: [],
        };
    }
    const payload = {
        page: page,
        pageSize: pageSize,
        sortBy: sortBy || "status.dropDownValue",
        descending: descending || false,
        sorts: {}, // Always empty for now
        searchText: searchText || "",
        requirementNumber: requirementNumber || "0",
        projectIds: [projectId],
        projectModuleIds: [],
        requirementGroupIds: [],
        name: "",
        requirementType: null,
        statusIds: [],
        identifiedByIds: [],
        fromDate: null,
        toDate: null,
        requirementTagIds: []
    };
    try {
        const rawRequirementData = await meldepClient.getAllRequirementsByProject(payload);
        logger.info({
            rawRequirementData,
        }, 'Requirements raw response before mapping');
        const aiFriendlyRequirements = mapRequirementResponse(rawRequirementData);
        return {
            isError: false,
            message: 'Requirement details retrieved and mapped successfully.',
            data: aiFriendlyRequirements,
        };
    }
    catch (error) {
        logger.error({ error }, 'Error fetching requirements.');
        return {
            isError: true,
            message: `Failed to retrieve requirement details: ${error.message}`,
            data: [],
        };
    }
}
export const getAllRequirementsByProjectTool = {
    name: 'get_all_requirements_by_project',
    description: 'Retrieves and processes requirement data for a given project from Meldep ERP, providing an AI-friendly, structured overview with strict pagination and payload optimization. Supports filtering by project ID, page, pageSize, sortBy, descending, searchText, and requirementNumber.',
    inputSchema: {
        type: 'object',
        properties: {
            page: {
                type: 'number',
                description: 'The page number for pagination.',
            },
            pageSize: {
                type: 'number',
                description: 'The number of records to take per page (max 20).',
            },
            sortBy: {
                type: 'string',
                description: 'Optional: The field to sort the requirements by. Defaults to "status.dropDownValue".',
            },
            descending: {
                type: 'boolean',
                description: 'Optional: Whether to sort in descending order. Defaults to false.',
            },
            searchText: {
                type: 'string',
                description: 'Optional: Text to search within requirements.',
            },
            requirementNumber: {
                type: 'string',
                description: 'Optional: Specific requirement number to search for. Defaults to "0".',
            },
        },
        required: ['page', 'pageSize'],
    },
};
export async function executeGetAllRequirementsByProjectToolHandler(input) {
    return executeGetAllRequirementsByProjectTool(input);
}

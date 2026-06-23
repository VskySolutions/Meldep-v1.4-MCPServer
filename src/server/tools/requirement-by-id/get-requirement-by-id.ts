// @ts-nocheck
import { z } from 'zod';
import { meldepClient } from '../../client/meldep-client.js';
import { sessionStore } from '../../auth/session-store.js';
import { mapRequirementByIdResponse } from './mappers/requirement-by-id.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

async function executeGetRequirementByIdTool(input) {
    const { requirementId } = input;

    if (!requirementId) {
        return { isError: true, message: 'requirementId is required.', data: null };
    }

    const projectId = sessionStore.getProjectId();
    if (!projectId) {
        return { isError: true, message: 'Project ID not found in session.', data: null };
    }

    try {
        let uuid = requirementId;

        // If input looks like a requirement NUMBER (e.g. "1360") rather than a UUID,
        // resolve it to a UUID first via the list endpoint
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requirementId);

        if (!isUUID) {
            console.error(`DEBUG: "${requirementId}" looks like a requirement number, resolving UUID...`);

            const listPayload = {
                page: 1,
                pageSize: 1,
                sortBy: 'status.dropDownValue',
                descending: false,
                sorts: {},
                searchText: '',
                requirementNumber: requirementId,   // filter by req number
                projectIds: [projectId],
                projectModuleIds: [],
                requirementGroupIds: [],
                name: '',
                requirementType: null,
                statusIds: [],
                identifiedByIds: [],
                fromDate: null,
                toDate: null,
                requirementTagIds: [],
            };

            const listResult = await meldepClient.getAllRequirementsByProject(listPayload);

            const match = listResult?.data?.[0];
            if (!match || !match.id) {
                return {
                    isError: true,
                    message: `No requirement found with number "${requirementId}".`,
                    data: null,
                };
            }

            uuid = match.id;
            console.error(`DEBUG: Resolved requirement number ${requirementId} → UUID ${uuid}`);
        }

        // Now fetch full details using the UUID
        const rawData = await meldepClient.getRequirementById(uuid);
        const mapped = mapRequirementByIdResponse(rawData);

        return {
            isError: false,
            message: 'Requirement retrieved successfully.',
            data: mapped,
        };

    } catch (error) {
        logger.error({ error }, 'Error fetching requirement by ID.');
        return {
            isError: true,
            message: `Failed to retrieve requirement details: ${error.message}`,
            data: null,
        };
    }
}

export const getRequirementByIdTool = {
    name: 'get_requirement_by_id',

    description: `Retrieves complete details of a specific requirement, including its description, status, approval information, project details, ownership, dates, and linked tasks.

Use when you need to review a requirement's full details, understand its business context, track its status, or inspect associated tasks.

Args:
    requirementId (str): Requirement number (e.g., 1182) or requirement UUID (e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).

Response:
{
    "isError": false,
    "message": "Requirement retrieved successfully.",
    "data": {
        "requirementId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "requirementNo": 1182,
        "requirementTitle": "Project Requirement Generation Using Historical Performance Data & Existing Documents",
        "requirementDescription": "Implement an AI-based solution to generate project requirements...",
        "requirementModule": "AI Testing Assistant",
        "requirementProject": "Project Name",
        "requirementEnteredBy": "John Doe",
        "requirementIdentifiedBy": "Jane Doe",
        "requirementStatus": "Close",
        "approvalStatus": "Approved",
        "requirementPriority": "N/A",
        "identifiedDate": "05/06/2026",
        "createdDate": "05/06/2026 06:19 PM",
        "modifiedDate": "06/06/2026 11:44 AM",
        "notes": "",
        "tasks": [
            {
                "taskId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "taskNumber": 14100,
                "taskStatus": "Close"
            }
        ]
    }
}`,
    inputSchema: {
        type: 'object',
        properties: {
            requirementId: {
                type: 'string',
                description: 'The requirement number (e.g. "1360") or UUID. Requirement number is preferred as it is what users see in the UI.',
            },
        },
        required: ['requirementId'],
    },
};

export async function executeGetRequirementByIdToolHandler(input) {
    return executeGetRequirementByIdTool(input);
}
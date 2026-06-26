// @ts-nocheck
import { meldepClient } from '../../client/meldep-client.js';
import { sessionStore } from '../../auth/session-store.js';
import { mapRequirementListResponse, mapRequirementByIdResponse } from './mappers/requirement-unified.mapper.js';

const logger = {
    info:  (...args) => console.error(...args),
    warn:  (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

// ---------------------------------------------------------------------------
// Status name → UUID map (authoritative; copied from get_requirements_by_status)
// ---------------------------------------------------------------------------
const REQUIREMENT_STATUS_MAP = {
    'cancelled':           '32c0932b-8aa1-4c5c-9df9-745226070b53',
    'close':               'CAE0104E-4286-4F00-B4E6-4C07315ADE05',
    'closed':              'CAE0104E-4286-4F00-B4E6-4C07315ADE05',
    'dev deployed':        '8d8a3802-19d4-4abd-b6fc-699ed3fea590',
    'in progress':         '522719C9-C19D-4403-B0D3-B2786561C7F5',
    'in testing':          '518facfc-fac7-4a57-ab77-f6b01e7a8588',
    'new':                 '0A9A7DFD-D486-4442-85F8-D7A9CC7796C2',
    'on hold by client':   '599E778E-C6A9-4A4F-8298-0EDF0FACD584',
    'on hold':             '599E778E-C6A9-4A4F-8298-0EDF0FACD584',
    'open':                '206BFAF0-E94E-4471-8693-7868620814C2',
    'paused by dev team':  'aa7cc1f9-cdd1-4002-a90d-1991a3b3c071',
    'paused':              'aa7cc1f9-cdd1-4002-a90d-1991a3b3c071',
    'prod deployed':       '572b993f-df95-48a9-a49c-c605820620eb',
    'ready for prod':      '1b2362fa-2d89-4e53-8199-8028ca72a0df',
    'supp deployed':       '93344efd-f6b3-4b79-ae24-738b3ec424f3',
    'test deployed':       '32a1cdc8-0578-46a5-a42b-a925b1db27d9',
    'waiting for someone': 'f50d4595-f6ad-43c2-9ec1-730bf45eddd2',
    'waiting':             'f50d4595-f6ad-43c2-9ec1-730bf45eddd2',
};

const VALID_STATUS_LABELS = Object.keys(REQUIREMENT_STATUS_MAP)
    .filter(k => !['closed', 'on hold', 'paused', 'waiting'].includes(k));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveStatusIds(statuses) {
    const resolved = [];
    const unrecognized = [];
    for (const s of statuses) {
        const key = s.trim().toLowerCase();
        if (REQUIREMENT_STATUS_MAP[key]) {
            resolved.push(REQUIREMENT_STATUS_MAP[key]);
        } else {
            unrecognized.push(s);
        }
    }
    return { resolved, unrecognized };
}

function isUUID(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// ---------------------------------------------------------------------------
// Core execution
// ---------------------------------------------------------------------------

async function executeGetRequirementsTool(input) {
    const {
        projectId: inputProjectId,
        requirementId,
        statuses,
        moduleIds,
        searchText,
        requirementNumber,
        page,
        pageSize,
        sortBy,
        descending,
    } = input;

    // ── Step 1: Resolve projectId (input → session → error) ─────────────────
    const projectId = inputProjectId || sessionStore.getProjectId();
    if (!projectId) {
        return {
            isError: true,
            message: 'projectId is required but was not provided and is not set in the session. Please select a project or provide a projectId.',
            data: null,
        };
    }

    // ── Branch A: Single-record detail fetch ─────────────────────────────────
    if (requirementId) {
        try {
            let uuid = requirementId;

            if (!isUUID(requirementId)) {
                logger.debug(`"${requirementId}" looks like a requirement number — resolving UUID...`);

                const listPayload = {
                    page: 1,
                    pageSize: 1,
                    sortBy: 'status.dropDownValue',
                    descending: false,
                    sorts: {},
                    searchText: '',
                    requirementNumber: requirementId,
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
                logger.debug(`Resolved requirement number ${requirementId} → UUID ${uuid}`);
            }

            const rawData = await meldepClient.getRequirementById(uuid);
            const mapped  = mapRequirementByIdResponse(rawData);

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

    // ── Branch B: List fetch (with optional filters) ─────────────────────────
    let statusIds = [];
    let unrecognizedStatuses = [];

    if (statuses && statuses.length > 0) {
        const resolved = resolveStatusIds(statuses);
        statusIds = resolved.resolved;
        unrecognizedStatuses = resolved.unrecognized;

        if (statusIds.length === 0) {
            return {
                isError: true,
                message: `None of the provided statuses were recognized: ${unrecognizedStatuses.join(', ')}. Valid statuses are: ${VALID_STATUS_LABELS.join(', ')}.`,
                data: [],
            };
        }
    }

    const resolvedPage     = page     ?? 1;
    const resolvedPageSize = Math.min(pageSize ?? 20, 20);

    const payload = {
        page:                resolvedPage,
        pageSize:            resolvedPageSize,
        sortBy:              sortBy     || 'status.dropDownValue',
        descending:          descending || false,
        sorts:               {},
        searchText:          searchText        || '',
        requirementNumber:   requirementNumber || '0',
        projectIds:          [projectId],
        projectModuleIds:    moduleIds         || [],
        requirementGroupIds: [],
        name:                '',
        requirementType:     null,
        statusIds:           statusIds,
        identifiedByIds:     [],
        fromDate:            null,
        toDate:              null,
        requirementTagIds:   [],
    };

    try {
        const rawData = await meldepClient.getAllRequirementsByProject(payload);
        logger.info({ statusIds, moduleIds, searchText }, 'Requirements list fetched successfully.');

        const mapped = mapRequirementListResponse(rawData);

        let message = 'Requirements retrieved successfully.';
        if (unrecognizedStatuses.length > 0) {
            message = `Requirements retrieved. Note: these statuses were not recognized and were ignored: ${unrecognizedStatuses.join(', ')}.`;
        }

        return {
            isError:    false,
            message,
            totalCount: rawData?.total ?? mapped.length,
            page:       resolvedPage,
            pageSize:   resolvedPageSize,
            data:       mapped,
        };
    } catch (error) {
        logger.error({ error }, 'Error fetching requirements list.');
        return {
            isError: true,
            message: `Failed to retrieve requirements: ${error.message}`,
            data:    [],
        };
    }
}

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

// export const getRequirementsTool = {
//     name: 'get_requirements',

//     description: `Retrieves requirements for a project. This single tool replaces get_all_requirements_by_project, get_requirement_by_id, and get_requirements_by_status.

// ROUTING LOGIC:
// - If requirementId is provided → fetches full detail of that single requirement (description, notes, dates, tasks included).
// - Otherwise → fetches a paginated list, with optional filters for status, module, search text, and requirement number.

// PROJECTID RESOLUTION:
// - If projectId is provided in the call, it is used.
// - If not provided, the tool falls back to the projectId stored in the current session.
// - If neither is available, the tool returns an error asking for a projectId.

// PARAMETERS:
//   projectId (str, optional): Project UUID. Falls back to session if omitted.
//   requirementId (str, optional): Requirement UUID or number (e.g. "1360"). Triggers single-record detail fetch.
//   statuses (list[str], optional): Filter list by one or more status labels. Case-insensitive. E.g. ["Open"], ["In Progress", "New"]. Valid values: cancelled, close, dev deployed, in progress, in testing, new, on hold by client, open, paused by dev team, prod deployed, ready for prod, supp deployed, test deployed, waiting for someone.
//   moduleIds (list[str], optional): Filter list by one or more project module UUIDs.
//   searchText (str, optional): Free-text search within requirement titles/content.
//   requirementNumber (str, optional): Filter list by exact requirement number string.
//   page (int, optional): Page number for pagination. Default 1.
//   pageSize (int, optional): Records per page. Max 20. Default 20.
//   sortBy (str, optional): Field to sort by. Default "status.dropDownValue".
//   descending (bool, optional): Sort direction. Default false.

// RESPONSE — single record (requirementId provided):
// {
//   "isError": false,
//   "message": "Requirement retrieved successfully.",
//   "data": {
//     "requirementId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
//     "requirementNo": 1182,
//     "requirementTitle": "Project Requirement Generation Using Historical Performance Data",
//     "requirementDescription": "Implement an AI-based solution...",
//     "requirementModule": "AI Testing Assistant",
//     "requirementProject": "Project Name",
//     "requirementEnteredBy": "John Doe",
//     "requirementIdentifiedBy": "Jane Doe",
//     "requirementStatus": "Close",
//     "approvalStatus": "Approved",
//     "requirementPriority": "N/A",
//     "identifiedDate": "05/06/2026",
//     "createdDate": "05/06/2026 06:19 PM",
//     "modifiedDate": "06/06/2026 11:44 AM",
//     "notes": "",
//     "tasks": [{ "taskId": "...", "taskNumber": 14100, "taskStatus": "Close" }]
//   }
// }

// RESPONSE — list (no requirementId):
// {
//   "isError": false,
//   "message": "Requirements retrieved successfully.",
//   "totalCount": 42,
//   "page": 1,
//   "pageSize": 20,
//   "data": [
//     {
//       "requirementId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
//       "requirementNo": 1034,
//       "requirementTitle": "Implementation of AI Tools for Business Process",
//       "requirementModule": "AI Testing Assistant",
//       "requirementEnteredBy": "John Doe",
//       "requirementIdentifiedBy": "Jane Doe",
//       "requirementStatus": "In Progress",
//       "approvalStatus": "Approved",
//       "requirementPriority": "2nd",
//       "createdDate": "04/27/2026 02:32 PM",
//       "modifiedDate": "06/05/2026 06:58 PM",
//       "tasks": [{ "taskId": "...", "taskNumber": 13675, "taskStatus": "Open" }]
//     }
//   ]
// }`,

//     inputSchema: {
//         type: 'object',
//         properties: {
//             projectId: {
//                 type: 'string',
//                 description: 'Project UUID. Optional — falls back to the session projectId if not provided.',
//             },
//             requirementId: {
//                 type: 'string',
//                 description: 'Requirement number (e.g. "1360") or UUID. When provided, returns full detail of that single requirement.',
//             },
//             statuses: {
//                 type: 'array',
//                 items: { type: 'string' },
//                 description: 'Filter list results by one or more status labels. Case-insensitive. E.g. ["Open"], ["In Progress", "New"].',
//             },
//             moduleIds: {
//                 type: 'array',
//                 items: { type: 'string' },
//                 description: 'Filter list results by one or more project module UUIDs.',
//             },
//             searchText: {
//                 type: 'string',
//                 description: 'Free-text search within requirements.',
//             },
//             requirementNumber: {
//                 type: 'string',
//                 description: 'Filter list by exact requirement number. Use requirementId instead if you want full detail of a specific requirement.',
//             },
//             page: {
//                 type: 'number',
//                 description: 'Page number for pagination. Default 1.',
//             },
//             pageSize: {
//                 type: 'number',
//                 description: 'Records per page. Maximum 20. Default 20.',
//             },
//             sortBy: {
//                 type: 'string',
//                 description: 'Field to sort results by. Default "status.dropDownValue".',
//             },
//             descending: {
//                 type: 'boolean',
//                 description: 'Sort in descending order. Default false.',
//             },
//         },
//         required: [],
//     },
// };



export const getRequirementsTool = {
    name: 'get_requirements',

    description: `Retrieves requirements for a project from Meldep ERP. This single tool handles fetching full details for a specific requirement or querying a paginated, filterable list of requirements.

ROUTING LOGIC:
- If requirementId is provided → fetches full detail of that single requirement (including description, notes, dates, and related tasks).
- Otherwise → fetches a paginated list of requirements, with optional filters for status, module, search text, and requirement number.

PROJECTID RESOLUTION:
- If projectId is provided in the call, it is used.
- If omitted, the tool automatically falls back to the projectId stored in the active session.
- If neither is available, it returns an error requesting a projectId.

Args:
    projectId (str, optional): Project UUID. Falls back to session if omitted.
    requirementId (str, optional): Requirement UUID or number (e.g., "1360"). Triggers single-record detail fetch.
    statuses (list[str], optional): Filter list by one or more status labels. Case-insensitive (e.g., ["Open"], ["In Progress", "New"]). Valid labels: cancelled, close, dev deployed, in progress, in testing, new, on hold by client, open, paused by dev team, prod deployed, ready for prod, supp deployed, test deployed, waiting for someone.
    moduleIds (list[str], optional): Filter list by one or more project module UUIDs.
    searchText (str, optional): Free-text search keyword to match within requirement titles or content.
    requirementNumber (str, optional): Filter list by exact requirement number string.
    page (int, optional): Page number for pagination. Default is 1.
    pageSize (int, optional): Number of records to retrieve per page. Maximum and default is 20.
    sortBy (str, optional): Field name to sort by. Default is "status.dropDownValue".
    descending (bool, optional): Whether to sort in descending order. Default is false.

Response (Single Record Mode - when requirementId is provided):
{
    "isError": false,
    "message": "Requirement retrieved successfully.",
    "data": {
        "requirementId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "requirementNo": 1182,
        "requirementTitle": "Project Requirement Generation Using Historical Performance Data",
        "requirementDescription": "Implement an AI-based solution...",
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
}

Response (List Mode - when requirementId is omitted):
{
    "isError": false,
    "message": "Requirements retrieved successfully.",
    "totalCount": 42,
    "page": 1,
    "pageSize": 20,
    "data": [
        {
            "requirementId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            "requirementNo": 1034,
            "requirementTitle": "Implementation of AI Tools for Business Process",
            "requirementModule": "AI Testing Assistant",
            "requirementEnteredBy": "John Doe",
            "requirementIdentifiedBy": "Jane Doe",
            "requirementStatus": "In Progress",
            "approvalStatus": "Approved",
            "requirementPriority": "2nd",
            "createdDate": "04/27/2026 02:32 PM",
            "modifiedDate": "06/05/2026 06:58 PM",
            "tasks": [
                {
                    "taskId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                    "taskNumber": 13675,
                    "taskStatus": "Open"
                }
            ]
        }
    ]
}`,

    inputSchema: {
        type: 'object',
        properties: {
            projectId: {
                type: 'string',
                description: 'Project UUID. Optional — falls back to the session projectId if not provided.',
            },
            requirementId: {
                type: 'string',
                description: 'Requirement number (e.g., "1360") or UUID. When provided, returns full detail of that single requirement.',
            },
            statuses: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter list results by one or more status labels. Case-insensitive. E.g., ["Open"], ["In Progress", "New"].',
            },
            moduleIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter list results by one or more project module UUIDs.',
            },
            searchText: {
                type: 'string',
                description: 'Free-text search within requirements.',
            },
            requirementNumber: {
                type: 'string',
                description: 'Filter list by exact requirement number. Use requirementId instead if you want full detail of a specific requirement.',
            },
            page: {
                type: 'number',
                description: 'Page number for pagination. Default 1.',
            },
            pageSize: {
                type: 'number',
                description: 'Records per page. Maximum 20. Default 20.',
            },
            sortBy: {
                type: 'string',
                description: 'Field to sort results by. Default "status.dropDownValue".',
            },
            descending: {
                type: 'boolean',
                description: 'Sort in descending order. Default false.',
            },
        },
        required: [],
    },
};

export async function executeGetRequirementsToolHandler(input) {
    return executeGetRequirementsTool(input);
}

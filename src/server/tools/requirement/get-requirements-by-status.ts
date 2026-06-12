// @ts-nocheck
import { z } from 'zod';
import { meldepClient } from '../../client/meldep-client.js';
import { sessionStore } from '../../auth/session-store.js';
import { mapRequirementsByStatusResponse } from './mappers/requirement-by-status.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

// Static map of status name → UUID (from /drop-downs-type/list?type=Requirement%20Status)
const REQUIREMENT_STATUS_MAP: Record<string, string> = {
    'cancelled':           '32c0932b-8aa1-4c5c-9df9-745226070b53',
    'close':               'CAE0104E-4286-4F00-B4E6-4C07315ADE05',
    'closed':              'CAE0104E-4286-4F00-B4E6-4C07315ADE05', // alias
    'dev deployed':        '8d8a3802-19d4-4abd-b6fc-699ed3fea590',
    'in progress':         '522719C9-C19D-4403-B0D3-B2786561C7F5',
    'in testing':          '518facfc-fac7-4a57-ab77-f6b01e7a8588',
    'new':                 '0A9A7DFD-D486-4442-85F8-D7A9CC7796C2',
    'on hold by client':   '599E778E-C6A9-4A4F-8298-0EDF0FACD584',
    'on hold':             '599E778E-C6A9-4A4F-8298-0EDF0FACD584', // alias
    'open':                '206BFAF0-E94E-4471-8693-7868620814C2',
    'paused by dev team':  'aa7cc1f9-cdd1-4002-a90d-1991a3b3c071',
    'paused':              'aa7cc1f9-cdd1-4002-a90d-1991a3b3c071', // alias
    'prod deployed':       '572b993f-df95-48a9-a49c-c605820620eb',
    'ready for prod':      '1b2362fa-2d89-4e53-8199-8028ca72a0df',
    'supp deployed':       '93344efd-f6b3-4b79-ae24-738b3ec424f3',
    'test deployed':       '32a1cdc8-0578-46a5-a42b-a925b1db27d9',
    'waiting for someone': 'f50d4595-f6ad-43c2-9ec1-730bf45eddd2',
    'waiting':             'f50d4595-f6ad-43c2-9ec1-730bf45eddd2', // alias
};

function resolveStatusIds(statuses: string[]): { resolved: string[]; unrecognized: string[] } {
    const resolved: string[] = [];
    const unrecognized: string[] = [];

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

async function executeGetRequirementsByStatusTool(input) {
    const { statuses, page, pageSize } = input;

    const projectId = sessionStore.getProjectId();
    if (!projectId) {
        return { isError: true, message: 'Project ID not found in session.', data: [] };
    }

    if (!statuses || statuses.length === 0) {
        return { isError: true, message: 'At least one status must be provided.', data: [] };
    }

    const { resolved, unrecognized } = resolveStatusIds(statuses);

    if (resolved.length === 0) {
        return {
            isError: true,
            message: `None of the provided statuses were recognized: ${unrecognized.join(', ')}. Valid statuses are: ${Object.keys(REQUIREMENT_STATUS_MAP).filter(k => !['closed','on hold','paused','waiting'].includes(k)).join(', ')}.`,
            data: [],
        };
    }

    const payload = {
        page: page ?? 1,
        pageSize: pageSize ?? 20,
        sortBy: 'status.dropDownValue',
        descending: false,
        sorts: {},
        searchText: '',
        requirementNumber: '0',
        projectIds: [projectId],
        projectModuleIds: [],
        requirementGroupIds: [],
        name: '',
        requirementType: null,
        statusIds: resolved,        // ← filtered by status UUIDs
        identifiedByIds: [],
        fromDate: null,
        toDate: null,
        requirementTagIds: [],
    };

    try {
        const rawData = await meldepClient.getAllRequirementsByProject(payload);
        logger.info({ statusIds: resolved }, 'Successfully fetched requirements by status.');

        const mapped = mapRequirementsByStatusResponse(rawData);

        return {
            isError: false,
            message: unrecognized.length > 0
                ? `Requirements retrieved. Note: these statuses were not recognized and ignored: ${unrecognized.join(', ')}.`
                : 'Requirements retrieved successfully.',
            totalCount: rawData?.total ?? mapped.length,
            page: page ?? 1,
            pageSize: pageSize ?? 20,
            data: mapped,
        };
    } catch (error) {
        logger.error({ error }, 'Error fetching requirements by status.');
        return {
            isError: true,
            message: `Failed to retrieve requirements: ${error.message}`,
            data: [],
        };
    }
}

export const getRequirementsByStatusTool = {
    name: 'get_requirements_by_status',
    description: `Retrieves requirements from Meldep ERP filtered by one or more statuses.
Use this when a PM asks things like:
- "Show me all open requirements"
- "List requirements in progress"
- "What requirements are ready for prod?"
- "Show cancelled and on hold requirements"

Available statuses: New, Open, In Progress, On Hold by Client, Dev Deployed, Supp Deployed, Test Deployed, In Testing, Waiting for someone, Paused by Dev team, Ready for Prod, Prod Deployed, Cancelled, Close.
Common aliases also accepted: "closed" = Close, "on hold" = On Hold by Client, "paused" = Paused by Dev team, "waiting" = Waiting for someone.

Returns requirement ID, number, title, module, status, priority, entered by, identified by, and linked task summary.`,
    inputSchema: {
        type: 'object',
        properties: {
            statuses: {
                type: 'array',
                items: { type: 'string' },
                description: 'One or more requirement statuses to filter by. E.g. ["Open"], ["In Progress", "New"], ["Ready for Prod"]. Case-insensitive.',
            },
            page: {
                type: 'number',
                description: 'Page number for pagination. Defaults to 1.',
            },
            pageSize: {
                type: 'number',
                description: 'Number of records per page. Max 20. Defaults to 20.',
            },
        },
        required: ['statuses'],
    },
};

export async function executeGetRequirementsByStatusToolHandler(input) {
    return executeGetRequirementsByStatusTool(input);
}

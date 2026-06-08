// @ts-nocheck
import { z } from 'zod';
import { meldepClient } from '../../client/meldep-client.js';
import { sessionStore } from '../../auth/session-store.js';
import { mapTimesheetResponse } from './mappers/timesheet.mapper.js';

const logger = {
    info:  (...args) => console.error(...args),
    warn:  (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

const GetTimesheetDataByDateRangeInputSchema = z.object({
    fromDate: z
        .string()
        .regex(DATE_REGEX, 'fromDate must be in MM/DD/YYYY format')
        .describe('Start date of the timesheet range. Example: "05/17/2026"'),
    toDate: z
        .string()
        .regex(DATE_REGEX, 'toDate must be in MM/DD/YYYY format')
        .describe('End date of the timesheet range. Example: "05/23/2026"'),
    searchForLoggedInUserTimesheets: z
        .boolean()
        .optional()
        .describe('If true, returns only the logged-in employee\'s timesheet entries.'),
});

async function executeGetTimesheetDataByDateRangeTool(input) {
    const { fromDate, toDate, searchForLoggedInUserTimesheets } = input;

    const projectId = sessionStore.getProjectId();
    if (!projectId) {
        return {
            isError: true,
            message: 'Project ID not found in session.',
            data: [],
        };
    }

    const employeeId = sessionStore.getEmployeeId();

    try {
        const rawData = await meldepClient.getTimesheetDataByDateRange({
            fromDate,
            toDate,
            projectId,
            employeeId: searchForLoggedInUserTimesheets
                ? (employeeId ?? '')
                : '',
        });

        const mapped = mapTimesheetResponse(rawData);
        return {
            isError: false,
            message: mapped.total > 0
                ? 'Successfully retrieved timesheet data.'
                : 'No timesheet entries found for the given date range.',
            data: mapped,
        };
    } catch (error) {
        logger.error({ error }, 'Error fetching timesheet data.');
        return {
            isError: true,
            message: error?.message || 'Failed to retrieve timesheet data.',
            data: [],
        };
    }
}

export const getTimesheetDataByDateRangeTool = {
    name: 'get_timesheet_data_by_daterange',
    description:
        'Retrieves timesheet entries from Meldep ERP for a given date range. ' +
        'Returns employee name, project, module, task, activity, hours logged, and work description. ' +
        'Project ID is read from session. Use searchForLoggedInUserTimesheets to filter by the logged-in employee.',
    inputSchema: {
        type: 'object',
        properties: {
            fromDate: {
                type: 'string',
                description: 'Start date in MM/DD/YYYY format. Example: "05/17/2026"',
            },
            toDate: {
                type: 'string',
                description: 'End date in MM/DD/YYYY format. Example: "05/23/2026"',
            },
            searchForLoggedInUserTimesheets: {
                type: 'boolean',
                description: 'Whether to return timesheet entries only for the logged-in employee.',
            },
        },
        required: ['fromDate', 'toDate'],
    },
};

export async function executeGetTimesheetDataByDateRangeToolHandler(input) {
    return executeGetTimesheetDataByDateRangeTool(input);
}
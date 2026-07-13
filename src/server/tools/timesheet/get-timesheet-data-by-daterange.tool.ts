// @ts-nocheck
import { z } from 'zod';

import { meldepClient } from '../../client/meldep-client.js';
import { sessionStore } from '../../auth/session-store.js';
import { mapTimesheetResponse } from './mappers/timesheet.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

const GetTimesheetDataByDateRangeInputSchema = z.object({
    projectId: z
        .string()
        .uuid()
        .optional()
        .describe(
            'Optional project UUID used to retrieve timesheet entries for a specific project. If omitted, the current session project ID is used.'
        ),

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
        .default(false)
        .describe(
            'If true, returns only the logged-in employee timesheet entries. If false, returns timesheet entries for the whole team.'
        ),
});

async function executeGetTimesheetDataByDateRangeTool(input) {
    try {
        const parsedInput =
            GetTimesheetDataByDateRangeInputSchema.parse(input);

        const {
            fromDate,
            toDate,
            searchForLoggedInUserTimesheets,
        } = parsedInput;

        const projectId =
            parsedInput.projectId || sessionStore.getProjectId();

        if (!projectId) {
            return {
                isError: true,
                message:
                    'Project ID not found. Please provide projectId or set it in the current session.',
                data: {
                    total: 0,
                    timesheets: [],
                },
            };
        }

        const employeeId = sessionStore.getEmployeeId();

        if (searchForLoggedInUserTimesheets && !employeeId) {
            return {
                isError: true,
                message:
                    'Employee ID not found in session for logged-in user timesheet filtering.',
                data: {
                    total: 0,
                    timesheets: [],
                },
            };
        }

        logger.info(
            {
                projectId,
                fromDate,
                toDate,
                searchForLoggedInUserTimesheets,
                employeeId: searchForLoggedInUserTimesheets
                    ? employeeId
                    : '',
            },
            'Fetching timesheet data by date range.'
        );

        const rawData =
            await meldepClient.getTimesheetDataByDateRange({
                fromDate,
                toDate,
                projectId,
                employeeId: searchForLoggedInUserTimesheets
                    ? employeeId
                    : '',
            });

        const mapped = mapTimesheetResponse(rawData, projectId);

        return {
            isError: false,
            message:
                mapped.total > 0
                    ? 'Successfully retrieved timesheet data.'
                    : 'No timesheet entries found for the given project and date range.',
            data: mapped,
        };
    } catch (error) {
        logger.error({ error }, 'Error fetching timesheet data.');

        return {
            isError: true,
            message:
                error?.message ||
                'Failed to retrieve timesheet data.',
            data: {
                total: 0,
                timesheets: [],
            },
        };
    }
}

export const getTimesheetDataByDateRangeTool = {
    name: 'get_timesheet_data_by_daterange',

    description: `Retrieves timesheet entries for a specified project and date range, including employee details, project information, tasks, activities, hours logged, billable hours, and work descriptions.

Use when you need to review employee timesheets, track work completed, analyze effort spent on tasks, or generate project-specific timesheet reports.

Args:
    projectId (str, optional): Project UUID used to retrieve timesheet entries for a specific project. If not provided, the current session project ID is used.
    fromDate (str): Start date in MM/DD/YYYY format.
    toDate (str): End date in MM/DD/YYYY format.
    searchForLoggedInUserTimesheets (bool, optional): If true, returns only the logged-in employee's entries. If false, returns the whole team's entries.

Response:
{
    "isError": false,
    "message": "Successfully retrieved timesheet data.",
    "data": {
        "total": 43,
        "timesheets": [
            {
                "timesheetDate": "06/17/2026",
                "employeeId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "employeeName": "John Doe",
                "lines": [
                    {
                        "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                        "projectName": "Project Name",
                        "moduleId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                        "moduleName": "Module Name",
                        "taskId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                        "taskNumber": "TASK-1001",
                        "taskName": "Task Name",
                        "activityId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                        "activityName": "Engineering",
                        "hours": 8,
                        "billableHours": 0,
                        "description": "Work completed during the timesheet period."
                    }
                ]
            }
        ]
    }
}`,

    inputSchema: {
        type: 'object',
        properties: {
            projectId: {
                type: 'string',
                description:
                    'Optional project UUID used to retrieve timesheet entries for a specific project. If omitted, the current session project ID is used.',
            },
            fromDate: {
                type: 'string',
                description:
                    'Start date in MM/DD/YYYY format. Example: "05/17/2026"',
            },
            toDate: {
                type: 'string',
                description:
                    'End date in MM/DD/YYYY format. Example: "05/23/2026"',
            },
            searchForLoggedInUserTimesheets: {
                type: 'boolean',
                description:
                    'If true, returns only the logged-in employee timesheet entries. If false, returns timesheet entries for the whole team.',
                default: false,
            },
        },
        required: ['fromDate', 'toDate'],
    },
};

export async function executeGetTimesheetDataByDateRangeToolHandler(
    input
) {
    return executeGetTimesheetDataByDateRangeTool(input);
}
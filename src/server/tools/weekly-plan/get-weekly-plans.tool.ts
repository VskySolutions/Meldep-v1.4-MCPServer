// @ts-nocheck
import { z } from 'zod';
function formatWeekEndDate(dateString) {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}
import { meldepClient } from '../../client/meldep-client.js';
import { sessionStore } from '../../auth/session-store.js';
import { mapWeeklyPlanResponse } from './mappers/weekly-plan.mapper.js';
const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};
const GetWeeklyPlanInputSchema = z.object({
    skipIndex: z
        .number()
        .int()
        .min(0)
        .describe('The number of records to skip for pagination.'),
    takeCount: z
        .number()
        .int()
        .min(1)
        .max(4)
        .describe('The number of records to take for pagination.'),
    weekEndDate: z
        .string()
        .optional()
        .describe('Optional: The week end date (mm/dd/yyyy HH:mm:ss) to filter the weekly plan.'),
});
async function executeGetWeeklyPlanTool(input) {
    const { skipIndex, takeCount, weekEndDate } = input;
    if (skipIndex < 0) {
        return {
            isError: true,
            message: 'skipIndex cannot be less than 0.',
            data: [],
        };
    }
    if (takeCount < 1 || takeCount > 4) {
        return {
            isError: true,
            message: 'takeCount must be between 1 and 4. You can ask for a maximum of 4 records at a time.',
            data: [],
        };
    }
    const projectId = sessionStore.getProjectId();
    if (!projectId) {
        return {
            isError: true,
            message: 'Project ID not found in session.',
            data: [],
        };
    }
    try {
        // TODO: Replace with actual meldepClient.getWeeklyPlanDetails once available
        const rawPlanData = await meldepClient.getWeeklyPlanDetails(projectId, skipIndex, takeCount, weekEndDate ? formatWeekEndDate(weekEndDate) : undefined);
        const aiFriendlyPlan = mapWeeklyPlanResponse(rawPlanData);
        return {
            isError: false,
            message: 'Weekly plan details retrieved successfully.',
            data: aiFriendlyPlan,
        };
    }
    catch (error) {
        logger.error({ error }, 'Error fetching weekly plan.');
        return {
            isError: true,
            message: `Failed to retrieve weekly plan details: ${error.message}`,
            data: [],
        };
    }
}
export const getWeeklyPlanTool = {
    name: 'get_weekly_plan',
    description: `Retrieves weekly plan details from Meldep ERP, including planned activities, actual progress, assigned team members, and estimated effort for a specific week or a range of weeks.

Use when you need to review weekly objectives, assigned resources, planned work, and progress updates.

Args:
    skipIndex (int): Number of records to skip for pagination (e.g., 0).
    takeCount (int): Number of records to retrieve per request (e.g., 4).
    weekEndDate (str, optional): Week end date in MM/DD/YYYY HH:mm:ss format used to filter a specific week (e.g., 06/21/2026 00:00:00).

Response:
{
    "isError": false,
    "message": "Weekly plan details retrieved successfully.",
    "data": [
        {
            "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            "weekDate": "06/21/2026",
            "projectWeeklyPlanDatesLines": [
                {
                    "expectedDescription": "Planned activities and objectives for the week...",
                    "actualDescription": "",
                    "expectedDescriptionCreatedBy": "John Doe",
                    "projectWeeklyPlanDatesLinesAssignedTo": [
                        {
                            "name": "Employee Name",
                            "estimateHrs": 16
                        }
                    ],
                    "employeeEstimateHoursForWeekSummaryList": []
                }
            ]
        }
    ]
}`,
    inputSchema: {
        type: 'object',
        properties: {
            skipIndex: {
                type: 'number',
                description: 'The number of records to skip for pagination.',
            },
            takeCount: {
                type: 'number',
                description: 'The number of records to take for pagination.',
            },
            weekEndDate: {
                type: 'string',
                description: 'Optional: The week end date (mm/dd/yyyy HH:mm:ss) to filter the weekly plan.(Week End day is Saturday/Sunday of each week.)',
            },
        },
        required: ['skipIndex', 'takeCount'],
    },
};
export async function executeGetWeeklyPlanToolHandler(input) {
    return executeGetWeeklyPlanTool(input);
}

// @ts-nocheck
import { z } from 'zod';

import { meldepClient } from '../../client/meldep-client.js';
import { sessionStore } from '../../auth/session-store.js';
import { mapWeeklyPlanResponse } from './mappers/weekly-plan.mapper.js';

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

const GetWeeklyPlanInputSchema = z.object({
    projectId: z.string().uuid().optional(),
    skipIndex: z.number().int().min(0),
    takeCount: z.number().int().min(1).max(4),
    weekEndDate: z.string().optional(),
});

async function executeGetWeeklyPlanTool(input) {
    const parsedInput = GetWeeklyPlanInputSchema.parse(input);

    const { skipIndex, takeCount, weekEndDate } = parsedInput;
    const projectId = parsedInput.projectId || sessionStore.getProjectId();

    if (!projectId) {
        return {
            isError: true,
            message: 'Project ID not found. Please provide projectId or set it in session.',
            data: [],
        };
    }

    try {
        const formattedWeekEndDate = weekEndDate
            ? formatWeekEndDate(weekEndDate)
            : undefined;

        const rawPlanData = await meldepClient.getWeeklyPlanDetails(
            projectId,
            skipIndex,
            takeCount,
            formattedWeekEndDate
        );

        const aiFriendlyPlan = mapWeeklyPlanResponse(rawPlanData, projectId);

        return {
            isError: false,
            message: 'Weekly plan details retrieved successfully.',
            data: aiFriendlyPlan,
        };
    } catch (error) {
        return {
            isError: true,
            message: `Failed to retrieve weekly plan details: ${error.message}`,
            data: [],
        };
    }
}

export const getWeeklyPlanTool = {
    name: 'get_weekly_plan',

    description: `Retrieves weekly plan details from Meldep ERP for a specific project, including planned activities, actual progress, assigned team members, and estimated effort.

Args:
    projectId (str, optional): Project UUID to fetch weekly plans for a specific project. If not provided, the tool uses the Project ID from the current session.
    skipIndex (int): Number of records to skip for pagination.
    takeCount (int): Number of records to retrieve per request. Maximum 4.
    weekEndDate (str, optional): Week end date in MM/DD/YYYY HH:mm:ss format.`,

    inputSchema: {
        type: 'object',
        properties: {
            projectId: {
                type: 'string',
                description:
                    'Optional project UUID to fetch weekly plans for a specific project. If not provided, session projectId will be used.',
            },
            skipIndex: {
                type: 'number',
                description: 'The number of records to skip for pagination.',
            },
            takeCount: {
                type: 'number',
                description:
                    'The number of records to take for pagination. Maximum allowed value is 4.',
            },
            weekEndDate: {
                type: 'string',
                description:
                    'Optional week end date in MM/DD/YYYY HH:mm:ss format.',
            },
        },
        required: ['skipIndex', 'takeCount'],
    },
};

export async function executeGetWeeklyPlanToolHandler(input) {
    return executeGetWeeklyPlanTool(input);
}
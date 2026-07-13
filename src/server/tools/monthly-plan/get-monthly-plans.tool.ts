// @ts-nocheck
import { z } from 'zod';

import { meldepClient } from '../../client/meldep-client.js';
import { sessionStore } from '../../auth/session-store.js';
import { mapMonthlyPlanResponse } from './mappers/monthly-plan.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

const GetMonthlyPlanInputSchema = z.object({
    projectId: z.string().uuid().optional(),

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
});

async function executeGetMonthlyPlanTool(input) {
    const parsedInput = GetMonthlyPlanInputSchema.parse(input);

    const { skipIndex, takeCount } = parsedInput;
    const projectId = parsedInput.projectId || sessionStore.getProjectId();

    if (!projectId) {
        return {
            isError: true,
            message: 'Project ID not found. Please provide projectId or set it in session.',
            data: [],
        };
    }

    try {
        const rawPlanData = await meldepClient.getMonthlyPlanDetails(
            projectId,
            skipIndex,
            takeCount
        );

        logger.info({ rawPlanData }, 'Monthly plan raw response before mapping');

        const aiFriendlyPlan = mapMonthlyPlanResponse(rawPlanData, projectId);

        return {
            isError: false,
            message: 'Monthly plan details retrieved successfully.',
            data: aiFriendlyPlan,
        };
    } catch (error) {
        logger.error({ error }, 'Error fetching monthly plan.');

        return {
            isError: true,
            message: `Failed to retrieve monthly plan details: ${error.message}`,
            data: [],
        };
    }
}

export const getMonthlyPlanTool = {
    name: 'get_monthly_plan',

    description: `Retrieves monthly plan details from Meldep ERP for a specific project, including planned targets, achieved targets, and plan ownership information.

Use when you need to review monthly planning objectives, progress updates, and target details.

Args:
    projectId (str, optional): Project UUID to fetch monthly plans for a specific project. If not provided, the tool uses the Project ID from the current session.
    skipIndex (int): Number of records to skip for pagination.
    takeCount (int): Number of records to retrieve per request. Maximum 4.`,

    inputSchema: {
        type: 'object',
        properties: {
            projectId: {
                type: 'string',
                description:
                    'Optional project UUID to fetch monthly plans for a specific project. If not provided, session projectId will be used.',
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
        },
        required: ['skipIndex', 'takeCount'],
    },
};

export async function executeGetMonthlyPlanToolHandler(input) {
    return executeGetMonthlyPlanTool(input);
}
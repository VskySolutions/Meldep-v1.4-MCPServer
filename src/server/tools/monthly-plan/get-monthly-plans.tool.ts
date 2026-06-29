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
    const { skipIndex, takeCount } = input;
    if (skipIndex < 0) {
        return {
            isError: true,
            message: 'skipIndex cannot be less than 0.',
            data: [],
        };
    }
    if (takeCount > 4) {
        return {
            isError: true,
            message: 'takeCount cannot exceed 4. You can ask for a maximum of 4 records at a time.',
            data: [],
        };
    }
    const projectId = sessionStore.getProjectId();
    if (!projectId) {
        throw new Error('Project ID not found in session.');
    }
    try {
        const rawPlanData = await meldepClient.getMonthlyPlanDetails(projectId, skipIndex, takeCount);
        logger.info({
            rawPlanData,
        }, 'Monthly plan raw response before mapping');
        const aiFriendlyPlan = mapMonthlyPlanResponse(rawPlanData);
        return {
            isError: false,
            message: 'Monthly plan details retrieved successfully.',
            data: aiFriendlyPlan,
        };
    }
    catch (error) {
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

    description: `Retrieves monthly plan details from Meldep ERP, including planned targets, achieved targets, and plan ownership information.

Use when you need to review monthly planning objectives, progress updates, and target details.

Args:
    skipIndex (int): Number of records to skip for pagination (e.g., 0).
    takeCount (int): Number of records to retrieve per request (e.g., 4).

Response:
{
    "isError": false,
    "message": "Monthly plan details retrieved successfully.",
    "data": [
        {
            "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            "monthDate": "06/01/2026",
            "projectMonthlyPlanDatesLines": [
                {
                    "expectedTargetDescription": "MCP Integration for BO Explorer...",
                    "actualAchievedTargetDescription": "Not Available",
                    "expectedDescriptionCreatedBy": "John Doe"
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
        },
        required: [],
    },
};
export async function executeGetMonthlyPlanToolHandler(input) {
    return executeGetMonthlyPlanTool(input);
}

// @ts-nocheck

import { meldepClient } from '../../client/meldep-client.js';
import {
    mapTestPlanByIdResponse,
} from './mappers/get-test-plan-by-id.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

/**
 * Validates whether the provided value is a valid UUID.
 *
 * @param {string} value
 * @returns {boolean}
 */
function isValidUuid(value) {
    const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return uuidPattern.test(value);
}

/**
 * Retrieves complete details of a specific test plan
 * using its unique Test Plan UUID.
 *
 * @param {Object} args
 * @param {string} args.testPlanId
 */
async function executeGetTestPlanByIdTool({
    testPlanId,
}) {
    const normalizedTestPlanId =
        typeof testPlanId === 'string'
            ? testPlanId.trim()
            : String(testPlanId ?? '').trim();

    if (!normalizedTestPlanId) {
        return {
            isError: true,
            message: 'Test Plan ID is required.',
            data: null,
        };
    }

    if (!isValidUuid(normalizedTestPlanId)) {
        return {
            isError: true,
            message:
                'Test Plan ID must be a valid UUID. Example: d375ceac-41f9-4b61-a01c-cdeefcf00575.',
            data: null,
        };
    }

    try {
        const rawData =
            await meldepClient.getTestPlanById(
                normalizedTestPlanId
            );

        const mappedData =
            mapTestPlanByIdResponse(
                rawData,
                normalizedTestPlanId
            );

        if (!mappedData) {
            return {
                isError: false,
                message:
                    `No test plan was found for Test Plan ID: ` +
                    `${normalizedTestPlanId}.`,
                data: null,
            };
        }

        return {
            isError: false,
            message:
                `Test plan retrieved successfully for Test Plan ID: ` +
                `${normalizedTestPlanId}.`,
            data: mappedData,
        };
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An unknown error occurred.';

        logger.error(
            {
                error,
                testPlanId: normalizedTestPlanId,
            },
            'Error fetching test plan by ID.'
        );

        return {
            isError: true,
            message:
                `Failed to retrieve test plan: ` +
                `${errorMessage}`,
            data: null,
        };
    }
}

/**
 * MCP tool definition.
 */
export const getTestPlanByIdTool = {
    name: 'get_test_plan_by_id',

    description: `Retrieves a single test plan from Meldep using its unique Test Plan UUID.

Use this tool when the user wants to view the details of a specific test plan.

Args:
    testPlanId (str, required): Unique UUID of the test plan to retrieve.

Response:
{
    "isError": false,
    "message": "Test plan retrieved successfully.",
    "data": {
        "testPlanId": "test-plan-uuid",
        "testPlanNumber": 1001,
        "testPlanName": "Sample Test Plan",
        "description": "Detailed description of the test plan.",
        "project": {
            "projectId": "project-uuid",
            "projectName": "Sample Project"
        }
    }
}`,

    inputSchema: {
        type: 'object',

        properties: {
            testPlanId: {
                type: 'string',
                description:
                    'Unique UUID of the test plan to retrieve.',
                pattern:
                    '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
            },
        },

        required: [
            'testPlanId',
        ],

        additionalProperties: false,
    },
};

/**
 * MCP tool handler.
 */
export async function executeGetTestPlanByIdToolHandler(
    args
) {
    return executeGetTestPlanByIdTool(
        args ?? {}
    );
}
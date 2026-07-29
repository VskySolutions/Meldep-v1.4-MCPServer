// @ts-nocheck

import { meldepClient } from '../../client/meldep-client.js';
import {
    mapTestCaseByIdResponse,
} from './mappers/get-test-case-by-id.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

/**
 * Validates a UUID value.
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
 * Retrieves all details of a test case using its unique UUID.
 *
 * @param {Object} args
 * @param {string} args.testCaseId
 */
async function executeGetTestCaseByIdTool({
    testCaseId,
}) {
    const normalizedTestCaseId =
        typeof testCaseId === 'string'
            ? testCaseId.trim()
            : String(testCaseId ?? '').trim();

    if (!normalizedTestCaseId) {
        return {
            isError: true,
            message: 'Test Case ID is required.',
            data: null,
        };
    }

    if (!isValidUuid(normalizedTestCaseId)) {
        return {
            isError: true,
            message:
                'Test Case ID must be a valid UUID. Example: 56e99b41-eb4e-452c-bb73-9d9c84b196fc.',
            data: null,
        };
    }

    try {
        const rawData =
            await meldepClient.getTestCaseById(
                normalizedTestCaseId
            );

        const mappedData =
            mapTestCaseByIdResponse(
                rawData,
                normalizedTestCaseId
            );

        if (!mappedData) {
            return {
                isError: false,
                message:
                    `No test case was found for Test Case ID: ` +
                    `${normalizedTestCaseId}.`,
                data: null,
            };
        }

        return {
            isError: false,
            message:
                `Test case retrieved successfully for Test Case ID: ` +
                `${normalizedTestCaseId}.`,
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
                testCaseId:
                    normalizedTestCaseId,
            },
            'Error fetching test case by ID.'
        );

        return {
            isError: true,
            message:
                `Failed to retrieve test case: ` +
                `${errorMessage}`,
            data: null,
        };
    }
}

/**
 * MCP tool definition.
 */
export const getTestCaseByIdTool = {
    name: 'get_test_case_by_id',

    description: `Retrieves a single test case from Meldep using its unique Test Case UUID.

Use this tool when the user wants to view the details of a specific test case.

Args:
    testCaseId (str, required): Unique UUID of the test case to retrieve.

Response:
{
    "isError": false,
    "message": "Test case retrieved successfully.",
    "data": {
        "testCaseId": "test-case-uuid",
        "testCaseNumber": 1001,
        "testCaseName": "Sample Test Case",
        "description": "Test case description.",
        "steps": "- Step 1\\n- Step 2\\n- Step 3",
        "expectedResult": "Expected result of the test case.",
        "actualResult": "Actual result of the test case.",
        "project": {
            "projectId": "project-uuid",
            "projectName": "Sample Project"
        },
        "status": {
            "statusId": "status-uuid",
            "statusName": "New"
        }
    }
}`,

    inputSchema: {
        type: 'object',

        properties: {
            testCaseId: {
                type: 'string',
                description:
                    'Unique UUID of the test case to retrieve.',
                pattern:
                    '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
            },
        },

        required: [
            'testCaseId',
        ],

        additionalProperties: false,
    },
};

/**
 * MCP tool handler.
 */
export async function executeGetTestCaseByIdToolHandler(
    args
) {
    return executeGetTestCaseByIdTool(
        args ?? {}
    );
}
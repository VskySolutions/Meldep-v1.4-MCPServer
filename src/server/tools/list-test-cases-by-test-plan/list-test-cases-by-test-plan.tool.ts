// @ts-nocheck

import { meldepClient } from '../../client/meldep-client.js';
import {
    mapTestCasesByTestPlanNameResponse,
} from './mappers/list-test-cases-by-test-plan.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

/**
 * Retrieves all test cases associated with a Test Plan Name.
 *
 * @param {Object} args
 * @param {string} args.testPlanName
 */
async function executeListTestCasesByTestPlanTool({
    testPlanName,
}) {
    const normalizedTestPlanName =
        typeof testPlanName === 'string'
            ? testPlanName.trim()
            : String(testPlanName ?? '').trim();

    if (!normalizedTestPlanName) {
        return {
            isError: true,
            message: 'Test Plan Name is required.',
            data: null,
        };
    }

    try {
        const rawData =
            await meldepClient.listTestCasesByTestPlan(
                normalizedTestPlanName
            );

        const mappedData =
            mapTestCasesByTestPlanNameResponse(
                rawData,
                normalizedTestPlanName
            );

        if (
            !mappedData ||
            mappedData.totalTestCases === 0
        ) {
            return {
                isError: false,
                message:
                    `No test cases were found for Test Plan Name: ` +
                    `${normalizedTestPlanName}.`,
                data: {
                    testPlanId: '',
                    testPlanNumber: null,
                    testPlanName:
                        normalizedTestPlanName,
                    projectId: '',
                    projectName: '',
                    totalTestCases: 0,
                    testCases: [],
                },
            };
        }

        return {
            isError: false,
            message:
                `${mappedData.totalTestCases} test case(s) ` +
                `retrieved successfully for Test Plan Name: ` +
                `${mappedData.testPlanName}.`,
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
                testPlanName:
                    normalizedTestPlanName,
            },
            'Error fetching test cases by Test Plan Name.'
        );

        return {
            isError: true,
            message:
                `Failed to retrieve test cases: ` +
                `${errorMessage}`,
            data: null,
        };
    }
}

/**
 * MCP tool definition.
 */
export const listTestCasesByTestPlanTool = {
    name: 'list_test_cases_by_test_plan',

    description: `Retrieves all test cases associated with a specified Test Plan Name from Meldep.

Use this tool when the user wants to view the list of test cases available under a specific test plan.

Args:
    testPlanName (str, required): Exact name of the test plan whose test cases should be retrieved.

Response:
{
    "isError": false,
    "message": "Test cases retrieved successfully.",
    "data": {
        "testPlanName": "Sample Test Plan",
        "totalTestCases": 2,
        "testCases": [
            {
                "testCaseId": "test-case-uuid-1",
                "testCaseNumber": 1001,
                "testCaseName": "Sample Test Case One",
                "description": "Description of the first test case.",
                "steps": "- Step 1\\n- Step 2\\n- Step 3",
                "expectedResult": "Expected result of the first test case.",
                "actualResult": "Actual result of the first test case.",
                "status": {
                    "statusId": "status-uuid",
                    "statusName": "New"
                }
            },
            {
                "testCaseId": "test-case-uuid-2",
                "testCaseNumber": 1002,
                "testCaseName": "Sample Test Case Two",
                "description": "Description of the second test case.",
                "steps": "- Step 1\\n- Step 2",
                "expectedResult": "Expected result of the second test case.",
                "actualResult": "Actual result of the second test case.",
                "status": {
                    "statusId": "status-uuid",
                    "statusName": "Completed"
                }
            }
        ]
    }
}`,

    inputSchema: {
        type: 'object',

        properties: {
            testPlanName: {
                type: 'string',
                description:
                    'Exact name of the test plan whose test cases should be retrieved.',
                minLength: 1,
            },
        },

        required: [
            'testPlanName',
        ],

        additionalProperties: false,
    },
};

/**
 * MCP tool handler.
 */
export async function executeListTestCasesByTestPlanToolHandler(
    args
) {
    return executeListTestCasesByTestPlanTool(
        args ?? {}
    );
}
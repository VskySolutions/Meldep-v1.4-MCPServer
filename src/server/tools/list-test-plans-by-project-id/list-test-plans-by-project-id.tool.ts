// @ts-nocheck

import { meldepClient } from '../../client/meldep-client.js';
import {
    mapTestPlansByProjectIdResponse,
} from './mappers/list-test-plans-by-project-id.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

/**
 * Validates whether a value is a valid UUID.
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
 * Retrieves all test plans belonging to a specified project.
 *
 * @param {Object} args
 * @param {string} args.projectId
 */
async function executeListTestPlansByProjectIdTool({
    projectId,
}) {
    const normalizedProjectId =
        typeof projectId === 'string'
            ? projectId.trim()
            : String(projectId ?? '').trim();

    if (!normalizedProjectId) {
        return {
            isError: true,
            message: 'Project ID is required.',
            data: null,
        };
    }

    if (!isValidUuid(normalizedProjectId)) {
        return {
            isError: true,
            message:
                'Project ID must be a valid UUID. Example: E9625BC4-AB91-46BF-A5D0-BC97756DD2B8.',
            data: null,
        };
    }

    try {
        const rawData =
            await meldepClient.listTestPlansByProjectId(
                normalizedProjectId
            );

        const mappedData =
            mapTestPlansByProjectIdResponse(
                rawData,
                normalizedProjectId
            );

        if (
            !mappedData ||
            mappedData.totalTestPlans === 0
        ) {
            return {
                isError: false,
                message:
                    `No test plans were found for Project ID: ` +
                    `${normalizedProjectId}.`,
                data: {
                    projectId:
                        normalizedProjectId,
                    projectName: '',
                    totalTestPlans: 0,
                    testPlans: [],
                },
            };
        }

        return {
            isError: false,
            message:
                `${mappedData.totalTestPlans} test plan(s) ` +
                `retrieved successfully for Project ID: ` +
                `${normalizedProjectId}.`,
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
                projectId:
                    normalizedProjectId,
            },
            'Error fetching test plans by project ID.'
        );

        return {
            isError: true,
            message:
                `Failed to retrieve test plans: ` +
                `${errorMessage}`,
            data: null,
        };
    }
}

/**
 * MCP tool definition.
 */
export const listTestPlansByProjectIdTool = {
    name: 'list_test_plans_by_project_id',

    description: `Retrieves all test plans associated with a specified Project UUID from Meldep.

Use this tool when the user wants to view the list of test plans available under a specific project.

Args:
    projectId (str, required): Unique UUID of the project whose test plans should be retrieved.

Response:
{
    "isError": false,
    "message": "Test plans retrieved successfully.",
    "data": {
        "projectId": "project-uuid",
        "totalTestPlans": 2,
        "testPlans": [
            {
                "testPlanId": "test-plan-uuid-1",
                "testPlanNumber": 1001,
                "testPlanName": "Sample Test Plan One",
                "description": "Description of the first test plan."
            },
            {
                "testPlanId": "test-plan-uuid-2",
                "testPlanNumber": 1002,
                "testPlanName": "Sample Test Plan Two",
                "description": "Description of the second test plan."
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
                    'Unique UUID of the project whose test plans should be retrieved.',
                pattern:
                    '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
            },
        },

        required: [
            'projectId',
        ],

        additionalProperties: false,
    },
};

/**
 * MCP tool handler.
 */
export async function executeListTestPlansByProjectIdToolHandler(
    args
) {
    return executeListTestPlansByProjectIdTool(
        args ?? {}
    );
}
// @ts-nocheck

import { z } from 'zod';
import { meldepClient } from '../../client/meldep-client.js';
import { sessionStore } from '../../auth/session-store.js';
import { mapTaskListResponse } from './mappers/task.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

const GetTaskByTaskNumberInputSchema = z.object({
    projectId: z
        .string()
        .min(1)
        .describe('Project UUID containing the task'),

    taskNumber: z
        .string()
        .optional()
        .describe('Task number to search'),

    page: z
        .number()
        .int()
        .min(1)
        .default(1)
        .describe('Page number'),

    pageSize: z
        .number()
        .int()
        .min(2)
        .max(20)
        .default(20)
        .describe('Number of records per page'),

    searchForLoggedInUserTasks: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to fetch tasks only for logged-in user'),

    searchText: z
        .string()
        .optional()
        .default('')
        .describe(
            'Search keyword to filter tasks by activity name or description. E.g. "re" will match "research", "review", etc.',
        ),
});

async function executeGetTaskByTaskNumberTool(input) {
    const {
        projectId,
        taskNumber,
        page,
        pageSize,
        searchForLoggedInUserTasks,
        searchText,
    } = GetTaskByTaskNumberInputSchema.parse(input);

    if (!projectId) {
        return {
            isError: true,
            message: 'Project ID is required.',
            data: [],
        };
    }

    if (pageSize > 20 || pageSize < 2) {
        return {
            isError: true,
            message: 'Page size must be between 2 and 20.',
            data: [],
        };
    }

    if (page < 1) {
        return {
            isError: true,
            message: 'Page number cannot be less than 1.',
            data: [],
        };
    }

    const employeeId = sessionStore.getEmployeeId();

    try {
        const rawTaskData = await meldepClient.getTaskByTaskNumber({
            page,
            pageSize,
            sortBy: 'createdOnUtc',
            descending: true,
            sorts: {},
            searchText: '',
            projectTaskNumber: taskNumber || '0',
            customerIds: [],
            companyContactIds: [],
            projectIds: [projectId],
            projectModuleIds: [],
            projectTaskIds: [],
            projectLeadsIds: [],
            activityOwners:
                searchForLoggedInUserTasks && employeeId
                    ? [employeeId]
                    : [],
            statusIds: [],
            priorityIds: [],
            taskTagsIds: [],
            isTemplate: false,
        });

        const aiFriendlyTask = mapTaskListResponse(rawTaskData);

        const filteredTask = searchText
            ? aiFriendlyTask
                  .map((task) => {
                      const matched =
                          task.activities?.filter((activity) => {
                              const match = activity.activityName
                                  ?.toLowerCase()
                                  .includes(searchText.toLowerCase());

                              console.error(
                                  `Checking: "${activity.activityName}" includes "${searchText}" → ${match}`,
                              );

                              return match;
                          }) ?? [];

                      return {
                          ...task,
                          activities: matched,
                      };
                  })
                  .filter((task) => task.activities.length > 0)
            : aiFriendlyTask;

        return {
            isError: false,
            message:
                filteredTask.length > 0
                    ? 'Successfully retrieved task details.'
                    : 'No tasks found matching the search criteria.',
            data: filteredTask,
        };
    } catch (error) {
        logger.error(
            {
                error,
            },
            'Error fetching task details.',
        );

        return {
            isError: true,
            message:
                error?.message || 'Failed to retrieve task details.',
            data: [],
        };
    }
}

export const getTaskByTaskNumberTool = {
    name: 'get_task_by_task_number',

    description: `Retrieves task details from Meldep ERP using a project ID and task number, including task information, assignment details, module information, status, priority, and associated activities.

Use when you need to review task details, track task progress, view assigned resources, or inspect activities linked to a task.

Args:
    projectId (str): Project UUID containing the task.
    taskNumber (str, optional): Task number to search for (e.g., "14100").
    page (int, optional): Page number for pagination (e.g., 1).
    pageSize (int, optional): Number of records to retrieve per page (e.g., 10).
    searchForLoggedInUserTasks (bool, optional): Whether to return only tasks assigned to the logged-in user.
    searchText (str, optional): Search keyword used to filter tasks by activity name or description.

Response:
{
    "isError": false,
    "message": "Successfully retrieved task details.",
    "data": [
        {
            "taskId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            "taskNumber": 14100,
            "taskName": "Project Requirement Generation Using Historical Performance Data & Existing Documents",
            "taskDescription": "Implement an AI-based solution to generate project requirements...",
            "taskEstimateTime": 16,
            "taskStartDate": "06/02/2026",
            "taskEndDate": "06/30/2026",
            "taskAssignedTo": "",
            "taskPriority": "Medium",
            "taskStatus": "Close",
            "taskModule": {
                "moduleId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "moduleName": "AI Testing Assistant"
            },
            "taskCreatedBy": "John Doe",
            "activities": [
                {
                    "activityId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                    "activityName": "Engineering",
                    "activityAssignedTo": "Jane Doe"
                }
            ]
        }
    ]
}`,

    inputSchema: {
        type: 'object',

        properties: {
            projectId: {
                type: 'string',
                description:
                    'Project UUID containing the task.',
            },

            taskNumber: {
                type: 'string',
                description: 'Task number to search.',
            },

            page: {
                type: 'number',
                description: 'Page number for pagination.',
            },

            pageSize: {
                type: 'number',
                description: 'Number of records per page.',
            },

            searchForLoggedInUserTasks: {
                type: 'boolean',
                description:
                    'Whether to search tasks only assigned to the logged-in user.',
            },

            searchText: {
                type: 'string',
                description:
                    'Search keyword used to filter tasks by activity name or description.',
            },
        },

        required: ['projectId'],
    },
};

export async function executeGetTaskByTaskNumberToolHandler(input) {
    return executeGetTaskByTaskNumberTool(input);
}
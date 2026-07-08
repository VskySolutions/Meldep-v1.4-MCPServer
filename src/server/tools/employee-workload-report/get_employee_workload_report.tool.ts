// @ts-nocheck

import { z } from 'zod';
import { meldepClient } from '../../client/meldep-client.js';
import { mapEmployeeWorkloadReport } from './mappers/get_employee_workload_report.mapper.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

const GetEmployeeWorkloadReportInputSchema = z.object({
    employeeId: z
        .string()
        .min(1)
        .describe(
            'Employee UUID used to retrieve workload information'
        ),
});

async function executeGetEmployeeWorkloadReportTool(input) {
    const { employeeId } = input;

    if (!employeeId) {
        return {
            isError: true,
            message: 'Employee ID is required.',
            data: [],
        };
    }

    try {
        const response =
            await meldepClient.getEmployeeWorkloadReport(
                employeeId
            );

        logger.info(
            { response },
            'Employee workload report response before mapping'
        );

        if (!response || response.isEmpty) {
            return {
                isError: true,
                message:
                    'Employee not found or no workload data available.',
                data: [],
            };
        }

        if (
            !response.activities ||
            response.activities.length === 0
        ) {
            return {
                isError: true,
                message:
                    'No workload data found for this employee.',
                data: [],
            };
        }

        const mappedResponse =
            mapEmployeeWorkloadReport(
                employeeId,
                response.activities,
                response.projects
            );

        return {
            isError: false,
            message:
                'Employee workload report retrieved successfully.',
            data: mappedResponse,
        };
    } catch (error) {
        logger.error(
            { error },
            'Error fetching employee workload report'
        );

        return {
            isError: true,
            message: `Failed to retrieve employee workload report: ${error.message}`,
            data: [],
        };
    }
}

export const getEmployeeWorkloadReportTool = {
    name: 'get_employee_workload_report',

    description: `Retrieves employee workload summary including task distribution, estimated hours, and actual hours.

Use when you need employee workload visibility.

Args:
    employee_id (str): Employee UUID (e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).

Response:
{
    "isError": false,
    "message": "Employee workload report retrieved successfully.",
    "data": [
        {
            "empId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            "employeeName": "John Doe",
            "AssignedTasksCount": {
                "InProgress": 5,
                "Open": 3
            },
            "AssignedHrs": {
                "InProgress": 40,
                "Open": 24
            },
            "TotalActualHrsCompleted": 64
        }
    ]
}`,

    inputSchema: {
        type: 'object',

        properties: {
            employeeId: {
                type: 'string',
                description:
                    'Employee UUID used to retrieve workload information',
            },
        },

        required: ['employeeId'],
    },
};

export async function executeGetEmployeeWorkloadReportToolHandler(
    input,
) {
    return executeGetEmployeeWorkloadReportTool(
        input
    );
}
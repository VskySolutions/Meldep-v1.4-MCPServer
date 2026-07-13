// @ts-nocheck
import { cleanHtml } from '../../../utils/html-to-text.js';

function getEmployeeName(entry) {
    const fullName = entry.user?.person?.fullName;

    if (fullName) {
        return fullName.trim();
    }

    const firstName =
        entry.user?.person?.firstName ||
        entry.employee?.person?.firstName ||
        '';

    const lastName =
        entry.user?.person?.lastName ||
        entry.employee?.person?.lastName ||
        '';

    const name = `${firstName} ${lastName}`.trim();

    return name || 'Unknown';
}

export function mapTimesheetResponse(
    rawResponse,
    requestedProjectId = ''
) {
    if (!rawResponse || !Array.isArray(rawResponse.data)) {
        return {
            total: 0,
            timesheets: [],
        };
    }

    const timesheets = rawResponse.data
        .map((entry) => {
            const mappedLines = (entry.timesheetLines ?? [])
                .map((line) => {
                    const projectId =
                        line.projectId ||
                        line.project?.id ||
                        requestedProjectId ||
                        '';

                    return {
                        projectId,
                        projectName:
                            line.project?.name ||
                            line.projectName ||
                            '',
                        moduleName:
                            line.projectModule?.name ||
                            line.moduleName ||
                            '',
                        taskName:
                            line.task?.name ||
                            line.taskName ||
                            '',
                        activityName:
                            line.projectActivity?.name ||
                            line.activityName ||
                            '',
                        hours: line.hours ?? 0,
                        billableHours: line.billableHours ?? 0,
                        description: cleanHtml(
                            line.description ?? ''
                        ),
                    };
                })
                .filter((line) => {
                    if (!requestedProjectId) {
                        return true;
                    }

                    return (
                        line.projectId.toLowerCase() ===
                        requestedProjectId.toLowerCase()
                    );
                });

            return {
                timesheetDate: entry.timesheetDate || '',
                employeeName: getEmployeeName(entry),
                lines: mappedLines,
            };
        })
        .filter((timesheet) => timesheet.lines.length > 0);

    const totalLines = timesheets.reduce(
        (total, timesheet) => total + timesheet.lines.length,
        0
    );

    return {
        total: totalLines,
        timesheets,
    };
}
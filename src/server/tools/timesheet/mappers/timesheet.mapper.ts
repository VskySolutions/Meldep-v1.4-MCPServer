// @ts-nocheck
import { cleanHtml } from '../../../utils/html-to-text.js';

export function mapTimesheetResponse(rawResponse) {
    if (!rawResponse || !Array.isArray(rawResponse.data)) {
        return { total: 0, timesheets: [] };
    }
    return {
        total: rawResponse.total ?? 0,
        timesheets: rawResponse.data.map((entry) => ({
            timesheetDate: entry.timesheetDate,
            employeeName: entry.user?.person?.fullName ?? 'Unknown',
            lines: (entry.timesheetLines ?? []).map((line) => ({
                projectName:    line.project?.name ?? '',
                moduleName:     line.projectModule?.name ?? '',
                taskName:       line.task?.name ?? '',
                activityName:   line.projectActivity?.name ?? '',
                hours:          line.hours ?? 0,
                billableHours:  line.billableHours ?? 0,
                description:    cleanHtml(line.description ?? ''),
            })),
        })),
    };
}
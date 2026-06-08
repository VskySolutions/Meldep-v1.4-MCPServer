// @ts-nocheck
import { cleanHtml } from '../../../utils/html-to-text.js';
export function mapTaskListResponse(rawTask) {
    if (!rawTask ||
        !Array.isArray(rawTask.data)) {
        return [];
    }
    return rawTask.data.map((task) => ({
        taskId: task.id,
        taskNumber: task.projectTaskNumber,
        taskName: task.name,
        taskDescription: cleanHtml(task.description || ''),
        taskEstimateTime: task.estimateTime || 0,
        taskStartDate: task.startDate || null,
        taskEndDate: task.endDate || null,
        taskAssignedTo: task.assignedTo?.person
            ? `${task.assignedTo.person.firstName || ''} ${task.assignedTo.person.lastName || ''}`.trim()
            : 'Unknown',
        taskPriority: task.priority?.dropDownValue ||
            'Unknown',
        taskStatus: task.status?.dropDownValue ||
            'Unknown',
        taskModule: task.projectModule
            ? {
                moduleId: task.projectModule.id,
                moduleName: task.projectModule.name,
            }
            : null,
        taskCreatedBy: task.createdBy?.person
            ? `${task.createdBy.person.firstName || ''} ${task.createdBy.person.lastName || ''}`.trim()
            : 'Unknown',
        activities: Array.isArray(task.projectActivities)
            ? task.projectActivities.map((activity) => ({
                activityId: activity.id,
                activityName: activity.name,
                activityAssignedTo: activity.assignedTo?.person
                    ? `${activity.assignedTo.person.firstName || ''} ${activity.assignedTo.person.lastName || ''}`.trim()
                    : 'Unknown',
            }))
            : [],
    }));
}

// @ts-nocheck
import { cleanHtml } from '../../../utils/html-to-text.js';
export function mapWeeklyPlanResponse(rawPlan) {
    if (!rawPlan || !Array.isArray(rawPlan)) {
        return [];
    }
    return rawPlan.map((plan) => {
        const mappedPlan = {
            id: plan.id,
            weekDate: plan.weekDate,
            projectWeeklyPlanDatesLines: []
        };
        if (plan.projectWeeklyPlanDatesLines && Array.isArray(plan.projectWeeklyPlanDatesLines)) {
            mappedPlan.projectWeeklyPlanDatesLines = plan.projectWeeklyPlanDatesLines.map((line) => {
                const mappedLine = {
                    expectedDescription: cleanHtml(line.expectedDescription || ''),
                    actualDescription: cleanHtml(line.actualDescription || ''),
                    expectedDescriptionCreatedBy: line.expectedDescriptionCreatedBy?.person?.firstName + ' ' + line.expectedDescriptionCreatedBy?.person?.lastName || '',
                    projectWeeklyPlanDatesLinesAssignedTo: [],
                    employeeEstimateHoursForWeekSummaryList: []
                };
                if (line.projectWeeklyPlanDatesLinesAssignedTo && Array.isArray(line.projectWeeklyPlanDatesLinesAssignedTo)) {
                    mappedLine.projectWeeklyPlanDatesLinesAssignedTo = line.projectWeeklyPlanDatesLinesAssignedTo.map((assignment) => ({
                        name: assignment.employee?.person?.firstName + ' ' + assignment.employee?.person?.lastName || '',
                        estimateHrs: assignment.estimatedHours || 0,
                    }));
                }
                if (line.employeeEstimateHoursForWeekSummaryList && Array.isArray(line.employeeEstimateHoursForWeekSummaryList)) {
                    mappedLine.employeeEstimateHoursForWeekSummaryList = line.employeeEstimateHoursForWeekSummaryList.map((summary) => ({
                        employeeName: summary.employee?.person?.firstName + ' ' + summary.employee?.person?.lastName || '',
                        totalEstimatedHours: summary.totalEstimatedHours || 0,
                    }));
                }
                return mappedLine;
            });
        }
        return mappedPlan;
    });
}

// @ts-nocheck
import { cleanHtml } from '../../../utils/html-to-text.js';

function getPersonName(personWrapper) {
    const person = personWrapper?.person || personWrapper || {};

    const firstName = person.firstName || '';
    const lastName = person.lastName || '';

    return `${firstName} ${lastName}`.trim();
}

function mapAssignedTo(assignments) {
    if (!Array.isArray(assignments)) {
        return [];
    }

    return assignments.map((assignment) => ({
        name: getPersonName(assignment.employee),
        estimateHrs: assignment.estimatedHours || 0,
    }));
}

function mapEmployeeSummary(summaryList) {
    if (!Array.isArray(summaryList)) {
        return [];
    }

    return summaryList.map((summary) => ({
        employeeName: getPersonName(summary.employee),
        totalEstimatedHours: summary.totalEstimatedHours || 0,
    }));
}

function mapPlanLines(lines) {
    if (!Array.isArray(lines)) {
        return [];
    }

    return lines.map((line) => ({
        expectedDescription: cleanHtml(line.expectedDescription || ''),
        actualDescription: cleanHtml(line.actualDescription || ''),
        expectedDescriptionCreatedBy: getPersonName(
            line.expectedDescriptionCreatedBy
        ),
        projectWeeklyPlanDatesLinesAssignedTo: mapAssignedTo(
            line.projectWeeklyPlanDatesLinesAssignedTo
        ),
        employeeEstimateHoursForWeekSummaryList: mapEmployeeSummary(
            line.employeeEstimateHoursForWeekSummaryList
        ),
    }));
}

export function mapWeeklyPlanResponse(rawPlan, requestedProjectId = '') {
    const plans = Array.isArray(rawPlan)
        ? rawPlan
        : rawPlan?.weeklyPlanList || [];

    if (!Array.isArray(plans)) {
        return [];
    }

    return plans.flatMap((plan) => {
        const projectId =
            plan.projectId ||
            plan.project?.id ||
            requestedProjectId ||
            '';

        const weekDates = Array.isArray(plan.projectWeeklyPlanDates)
            ? plan.projectWeeklyPlanDates
            : [];

        if (weekDates.length > 0) {
            return weekDates.map((weekDateBlock) => ({
                id: weekDateBlock.id || plan.id || '',
                projectId,
                weekDate: weekDateBlock.weekDate || plan.weekDate || '',
                isApproved: weekDateBlock.isApproved || false,
                isCompleted: weekDateBlock.isCompleted || false,
                completionPercentage:
                    weekDateBlock.completionPercentage || 0,
                projectWeeklyPlanDatesLines: mapPlanLines(
                    weekDateBlock.projectWeeklyPlanDatesLines
                ),
            }));
        }

        return {
            id: plan.id || '',
            projectId,
            weekDate: plan.weekDate || '',
            projectWeeklyPlanDatesLines: mapPlanLines(
                plan.projectWeeklyPlanDatesLines
            ),
        };
    });
}
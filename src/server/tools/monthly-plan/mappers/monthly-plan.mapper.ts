// @ts-nocheck
import { cleanHtml } from '../../../utils/html-to-text.js';

function getPersonName(personWrapper) {
    const person = personWrapper?.person || personWrapper || {};

    const firstName = person.firstName || '';
    const lastName = person.lastName || '';

    return `${firstName} ${lastName}`.trim();
}

function mapMonthlyLines(lines) {
    if (!Array.isArray(lines)) {
        return [];
    }

    return lines.map((line) => ({
        expectedTargetDescription: cleanHtml(
            line.expectedDescription || 'Not Available'
        ),
        actualAchievedTargetDescription: cleanHtml(
            line.actualDescription || 'Not Available'
        ),
        expectedDescriptionCreatedBy:
            getPersonName(line.expectedDescriptionCreatedBy) || 'Not Found',
    }));
}

export function mapMonthlyPlanResponse(rawPlan, requestedProjectId = '') {
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

        const planDates = Array.isArray(plan.projectWeeklyPlanDates)
            ? plan.projectWeeklyPlanDates
            : [];

        if (planDates.length > 0) {
            return planDates.map((dateBlock) => ({
                id: dateBlock.id || plan.id || '',
                projectId,
                monthDate:
                    dateBlock.weekDate ||
                    dateBlock.monthDate ||
                    plan.weekDate ||
                    plan.monthDate ||
                    '',
                isApproved: dateBlock.isApproved || false,
                isCompleted: dateBlock.isCompleted || false,
                completionPercentage: dateBlock.completionPercentage || 0,
                projectMonthlyPlanDatesLines: mapMonthlyLines(
                    dateBlock.projectWeeklyPlanDatesLines
                ),
            }));
        }

        return {
            id: plan.id || '',
            projectId,
            monthDate: plan.weekDate || plan.monthDate || '',
            projectMonthlyPlanDatesLines: mapMonthlyLines(
                plan.projectWeeklyPlanDatesLines
            ),
        };
    });
}
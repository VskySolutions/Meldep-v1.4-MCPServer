// @ts-nocheck
import { cleanHtml } from '../../../utils/html-to-text.js';
export function mapMonthlyPlanResponse(rawPlan) {
    if (!rawPlan || !Array.isArray(rawPlan)) {
        return [];
    }
    return rawPlan.map((plan) => {
        const mappedPlan = {
            id: plan.id,
            monthDate: plan.weekDate,
            projectMonthlyPlanDatesLines: [],
        };
        if (plan.projectWeeklyPlanDatesLines && Array.isArray(plan.projectWeeklyPlanDatesLines)) {
            mappedPlan.projectMonthlyPlanDatesLines = plan.projectWeeklyPlanDatesLines.map((line) => {
                const mappedLine = {
                    expectedTargetDescription: cleanHtml(line.expectedDescription || 'Not Available'),
                    actualAchievedTargetDescription: cleanHtml(line.actualDescription || 'Not Available'),
                    expectedDescriptionCreatedBy: line.expectedDescriptionCreatedBy?.person?.firstName + ' ' + line.expectedDescriptionCreatedBy?.person?.lastName || 'Not Found'
                };
                return mappedLine;
            });
        }
        return mappedPlan;
    });
}

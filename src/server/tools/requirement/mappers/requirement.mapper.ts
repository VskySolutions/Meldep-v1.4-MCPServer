// @ts-nocheck
// import { isNil } from 'lodash-es';
// Helper function to strip HTML tags
function stripHtmlTags(htmlString) {
    return htmlString ? htmlString.replace(/<[^>]*>?/gm, '') : '';
}
export function mapRequirementResponse(rawResponse) {
    if (!rawResponse || !Array.isArray(rawResponse.data)) {
        return [];
    }
    const aiFriendlyData = rawResponse.data.map((item) => {
        const requirementEnteredBy = ((item.requirementEntered && item.requirementEntered.person && item.requirementEntered.person.fullName)) || 'N/A';
        const requirementIdentifiedBy = ((item.employee && item.employee.person && item.employee.person.fullName)) || 'N/A';
        return {
            requirementId: item.id,
            requirementNo: item.requirementNumber,
            requirementTitle: stripHtmlTags(item.title),
            requirementModule: item.projectModule?.name || 'N/A',
            requirementEnteredBy: requirementEnteredBy,
            requirementIdentifiedBy: requirementIdentifiedBy,
            requirementStatus: item.status?.dropDownValue || 'N/A',
            requirementPriority: item.priority?.dropDownValue || 'N/A',
            tasks: (item.projectTaskRelatedMappings?.map((taskMapping) => ({
                taskId: taskMapping.taskId,
                taskNumber: taskMapping.projectTask?.projectTaskNumber,
                taskStatus: taskMapping.projectTask?.status?.dropDownValue,
            })) || []),
        };
    });
    return aiFriendlyData;
}

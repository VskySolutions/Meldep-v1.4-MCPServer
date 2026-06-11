// @ts-nocheck

function stripHtmlTags(htmlString) {
    return htmlString ? htmlString.replace(/<[^>]*>?/gm, '') : '';
}

export function mapRequirementsByStatusResponse(rawResponse) {
    if (!rawResponse || !Array.isArray(rawResponse.data)) {
        return [];
    }

    return rawResponse.data.map((item) => ({
        requirementId: item.id,
        requirementNo: item.requirementNumber,
        requirementTitle: stripHtmlTags(item.title),
        requirementModule: item.projectModule?.name || 'N/A',
        requirementEnteredBy: item.requirementEntered?.person?.fullName || 'N/A',
        requirementIdentifiedBy: item.employee?.person?.fullName || 'N/A',
        requirementStatus: item.status?.dropDownValue || 'N/A',
        approvalStatus: item.approvalStatusDropDown?.dropDownValue || 'N/A',
        requirementPriority: item.priority?.dropDownValue || 'N/A',
        createdDate: item.createdOnUtc || null,
        modifiedDate: item.updatedOnUtc || null,
        tasks: item.projectTaskRelatedMappings?.map((taskMapping) => ({
            taskId: taskMapping.taskId,
            taskNumber: taskMapping.projectTask?.projectTaskNumber || 'N/A',
            taskStatus: taskMapping.projectTask?.status?.dropDownValue || 'N/A',
        })) || [],
    }));
}
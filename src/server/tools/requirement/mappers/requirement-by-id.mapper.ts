// @ts-nocheck

function stripHtmlTags(htmlString) {
    if (!htmlString) return '';
    let text = htmlString.replace(/<[^>]*>?/gm, '');
    text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&ndash;/g, '–')
        .replace(/&mdash;/g, '—');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

export function mapRequirementByIdResponse(rawResponse) {
    // Detail endpoint returns the object directly (not wrapped in { data: [] })
    const item = rawResponse;

    if (!item || !item.id) return null;

    return {
        requirementId: item.id,
        requirementNo: item.requirementNumber,

        requirementTitle: stripHtmlTags(item.title),
        requirementDescription: stripHtmlTags(item.description || ''),  // ✅ now populated

        requirementModule: item.projectModule?.name || 'N/A',
        requirementProject: item.project?.name || 'N/A',

        requirementEnteredBy: item.requirementEntered?.person?.fullName || 'N/A',
        requirementIdentifiedBy: item.employee?.person?.fullName || 'N/A',

        requirementStatus: item.status?.dropDownValue || 'N/A',
        approvalStatus: item.approvalStatusDropDown?.dropDownValue || 'N/A',
        requirementPriority: item.priority?.dropDownValue || 'N/A',

        identifiedDate: item.identifiedDate || null,
        createdDate: item.createdOnUtc || null,
        modifiedDate: item.updatedOnUtc || null,

        notes: stripHtmlTags(item.notes || ''),

        // Task titles are NOT returned by this API — only taskNumber and status are available
        tasks: item.projectTaskRelatedMappings?.map((taskMapping) => ({
            taskId: taskMapping.taskId,
            taskNumber: taskMapping.projectTask?.projectTaskNumber || 'N/A',
            taskStatus: taskMapping.projectTask?.status?.dropDownValue || 'N/A',
        })) || [],
    };
}
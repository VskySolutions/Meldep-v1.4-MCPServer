// @ts-nocheck

// ---------------------------------------------------------------------------
// Unified Requirement Mapper
// Used by: get-requirements.tool.ts
// Exports:
//   mapRequirementListResponse  — list mode (all, by-status, by-module)
//   mapRequirementByIdResponse  — single-record detail mode
// ---------------------------------------------------------------------------

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

/**
 * Maps a paginated list API response to an AI-friendly array.
 * Used for: all-requirements, by-status, by-module, and combined filter queries.
 */
export function mapRequirementListResponse(rawResponse) {
    if (!rawResponse || !Array.isArray(rawResponse.data)) {
        return [];
    }

    return rawResponse.data.map((item) => ({
        requirementId:           item.id,
        requirementNo:           item.requirementNumber,
        requirementTitle:        stripHtmlTags(item.title),
        requirementModule:       item.projectModule?.name || 'N/A',
        requirementEnteredBy:    item.requirementEntered?.person?.fullName || 'N/A',
        requirementIdentifiedBy: item.employee?.person?.fullName || 'N/A',
        requirementStatus:       item.status?.dropDownValue || 'N/A',
        approvalStatus:          item.approvalStatusDropDown?.dropDownValue || 'N/A',
        requirementPriority:     item.priority?.dropDownValue || 'N/A',
        createdDate:             item.createdOnUtc || null,
        modifiedDate:            item.updatedOnUtc || null,
        tasks: item.projectTaskRelatedMappings?.map((taskMapping) => ({
            taskId:     taskMapping.taskId,
            taskNumber: taskMapping.projectTask?.projectTaskNumber || 'N/A',
            taskStatus: taskMapping.projectTask?.status?.dropDownValue || 'N/A',
        })) || [],
    }));
}

/**
 * Maps a single-requirement detail API response to an AI-friendly object.
 * Used for: requirementId-based fetch (detail mode).
 * Returns null if the raw response is missing or invalid.
 */
export function mapRequirementByIdResponse(rawResponse) {
    const item = rawResponse;
    if (!item || !item.id) return null;

    return {
        requirementId:           item.id,
        requirementNo:           item.requirementNumber,
        requirementTitle:        stripHtmlTags(item.title),
        requirementDescription:  stripHtmlTags(item.description || ''),
        requirementModule:       item.projectModule?.name || 'N/A',
        requirementProject:      item.project?.name || 'N/A',
        requirementEnteredBy:    item.requirementEntered?.person?.fullName || 'N/A',
        requirementIdentifiedBy: item.employee?.person?.fullName || 'N/A',
        requirementStatus:       item.status?.dropDownValue || 'N/A',
        approvalStatus:          item.approvalStatusDropDown?.dropDownValue || 'N/A',
        requirementPriority:     item.priority?.dropDownValue || 'N/A',
        identifiedDate:          item.identifiedDate || null,
        createdDate:             item.createdOnUtc || null,
        modifiedDate:            item.updatedOnUtc || null,
        notes:                   stripHtmlTags(item.notes || ''),
        tasks: item.projectTaskRelatedMappings?.map((taskMapping) => ({
            taskId:     taskMapping.taskId,
            taskNumber: taskMapping.projectTask?.projectTaskNumber || 'N/A',
            taskStatus: taskMapping.projectTask?.status?.dropDownValue || 'N/A',
        })) || [],
    };
}

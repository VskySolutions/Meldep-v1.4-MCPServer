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
 * Returns the latest valid requirement change-log description.
 *
 * Deleted records and records without descriptions are ignored.
 */
function getLatestRequirementChangeLogDescription(item) {
    if (!Array.isArray(item?.requirementChangeLog)) {
        return '';
    }

    const validLogs = item.requirementChangeLog.filter(
        (log) =>
            log &&
            log.deleted !== true &&
            String(log.description || '').trim() !== ''
    );

    if (validLogs.length === 0) {
        return '';
    }

    const latestLog = [...validLogs].sort((first, second) => {
        const firstDate =
            Date.parse(first.createdOnUtc || '') || 0;

        const secondDate =
            Date.parse(second.createdOnUtc || '') || 0;

        return secondDate - firstDate;
    })[0];

    return stripHtmlTags(
        latestLog?.description || ''
    );
}

/**
 * Returns the requested number of latest requirement descriptions.
 *
 * Change-log descriptions are returned newest first.
 * The main requirement description is treated as the oldest description
 * and is added after all valid change-log descriptions.
 */
function getRequirementDescriptions(
    item,
    requirementDescriptionCount
) {
    const descriptions = [];

    if (Array.isArray(item?.requirementChangeLog)) {
        const validLogs = item.requirementChangeLog
            .filter(
                (log) =>
                    log &&
                    log.deleted !== true &&
                    String(log.description || '').trim() !== ''
            )
            .sort((first, second) => {
                const firstDate =
                    Date.parse(first.createdOnUtc || '') || 0;

                const secondDate =
                    Date.parse(second.createdOnUtc || '') || 0;

                return secondDate - firstDate;
            });

        for (const log of validLogs) {
            descriptions.push(
                stripHtmlTags(
                    log.description || ''
                )
            );
        }
    }

    const originalDescription =
        stripHtmlTags(
            item?.description || ''
        );

    if (originalDescription) {
        descriptions.push(
            originalDescription
        );
    }

    return descriptions.slice(
        0,
        requirementDescriptionCount
    );
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
 *
 * When requirementDescriptionCount is provided:
 * - Returns requirementDescriptions containing the requested number
 *   of descriptions in newest-to-oldest order.
 *
 * When requirementDescriptionCount is omitted:
 * - Returns requirementDescription.
 * - Returns requirementChangeLogDescription.
 *
 * Returns null if the raw response is missing or invalid.
 */
export function mapRequirementByIdResponse(
    rawResponse,
    requirementDescriptionCount
) {
    const item = rawResponse;

    if (!item || !item.id) {
        return null;
    }

    return {
        requirementId:
            item.id,

        requirementNo:
            item.requirementNumber,

        requirementTitle:
            stripHtmlTags(
                item.title
            ),

        ...(requirementDescriptionCount
            ? {
                requirementDescriptions:
                    getRequirementDescriptions(
                        item,
                        requirementDescriptionCount
                    ),
            }
            : {
                requirementDescription:
                    stripHtmlTags(
                        item.description || ''
                    ),

                requirementChangeLogDescription:
                    getLatestRequirementChangeLogDescription(
                        item
                    ),
            }),

        requirementModule:
            item.projectModule?.name ||
            'N/A',

        requirementProject:
            item.project?.name ||
            'N/A',

        requirementEnteredBy:
            item.requirementEntered
                ?.person
                ?.fullName ||
            'N/A',

        requirementIdentifiedBy:
            item.employee
                ?.person
                ?.fullName ||
            'N/A',

        requirementStatus:
            item.status
                ?.dropDownValue ||
            'N/A',

        approvalStatus:
            item.approvalStatusDropDown
                ?.dropDownValue ||
            'N/A',

        requirementPriority:
            item.priority
                ?.dropDownValue ||
            'N/A',

        identifiedDate:
            item.identifiedDate ||
            null,

        createdDate:
            item.createdOnUtc ||
            null,

        modifiedDate:
            item.updatedOnUtc ||
            null,

        notes:
            stripHtmlTags(
                item.notes || ''
            ),

        lastNote:
            stripHtmlTags(
                item.lastNote || ''
            ),

        tasks:
            item.projectTaskRelatedMappings?.map(
                (taskMapping) => ({
                    taskId:
                        taskMapping.taskId,

                    taskNumber:
                        taskMapping.projectTask
                            ?.projectTaskNumber ||
                        'N/A',

                    taskStatus:
                        taskMapping.projectTask
                            ?.status
                            ?.dropDownValue ||
                        'N/A',
                })
            ) || [],
    };
}
// @ts-nocheck

/**
 * Converts a value to a trimmed string.
 *
 * @param {*} value
 * @returns {string}
 */
function toCleanString(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return '';
    }

    return String(value).trim();
}

/**
 * Converts a value to a valid number or null.
 *
 * @param {*} value
 * @returns {number|null}
 */
function toNumberOrNull(value) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return null;
    }

    const numericValue = Number(value);

    return Number.isFinite(numericValue)
        ? numericValue
        : null;
}

/**
 * Converts HTML content into readable plain text.
 *
 * @param {*} html
 * @returns {string}
 */
function stripHtml(html) {
    const value = toCleanString(html);

    if (!value) {
        return '';
    }

    return value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<li[^>]*>/gi, '- ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<\/ol>/gi, '\n')
        .replace(/<\/ul>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Extracts test-plan records from supported API response formats.
 *
 * Supported formats:
 * - { editing: false, data: [...] }
 * - { data: [...] }
 * - { data: {...} }
 * - [...]
 *
 * @param {*} rawResponse
 * @returns {Array}
 */
function extractTestPlanRecords(rawResponse) {
    if (!rawResponse) {
        return [];
    }

    if (Array.isArray(rawResponse)) {
        return rawResponse;
    }

    if (Array.isArray(rawResponse.data)) {
        return rawResponse.data;
    }

    if (
        rawResponse.data &&
        typeof rawResponse.data === 'object'
    ) {
        return [rawResponse.data];
    }

    return [];
}

/**
 * Maps a single test-plan record.
 *
 * Removed from output:
 * - project
 * - planMaker
 * - planReviewer
 *
 * @param {Object} item
 * @returns {Object|null}
 */
function mapSingleTestPlan(item) {
    if (
        !item ||
        typeof item !== 'object'
    ) {
        return null;
    }

    return {
        testPlanId: toCleanString(
            item.id
        ),

        testPlanNumber: toNumberOrNull(
            item.testPlanNumber
        ),

        testPlanName: toCleanString(
            item.name
        ),

        description: stripHtml(
            item.description
        ),
    };
}

/**
 * Maps all test plans associated with the requested project ID.
 *
 * The project ID is used only for filtering the raw response.
 * Project details are not included in the final mapped output.
 *
 * @param {*} rawResponse
 * @param {string} requestedProjectId
 * @returns {Object}
 */
export function mapTestPlansByProjectIdResponse(
    rawResponse,
    requestedProjectId
) {
    const records =
        extractTestPlanRecords(
            rawResponse
        );

    const normalizedProjectId =
        toCleanString(
            requestedProjectId
        ).toLowerCase();

    const matchingRecords =
        records.filter((item) => {
            const recordProjectId =
                toCleanString(
                    item?.projectId ||
                    item?.project?.id
                ).toLowerCase();

            return (
                recordProjectId ===
                normalizedProjectId
            );
        });

    const testPlans =
        matchingRecords
            .map((item) =>
                mapSingleTestPlan(item)
            )
            .filter(Boolean);

    return {
        projectId: toCleanString(
            requestedProjectId
        ),

        totalTestPlans:
            testPlans.length,

        testPlans,
    };
}
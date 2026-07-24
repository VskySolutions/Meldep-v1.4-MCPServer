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
 * - {...}
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

    if (typeof rawResponse === 'object') {
        return [rawResponse];
    }

    return [];
}

/**
 * Finds a test plan matching the requested UUID.
 *
 * Matching is case-insensitive.
 *
 * @param {Array} records
 * @param {string} requestedTestPlanId
 * @returns {Object|null}
 */
function findTestPlanById(
    records,
    requestedTestPlanId
) {
    if (
        !Array.isArray(records) ||
        records.length === 0
    ) {
        return null;
    }

    const normalizedRequestedId =
        toCleanString(
            requestedTestPlanId
        ).toLowerCase();

    if (!normalizedRequestedId) {
        return null;
    }

    return (
        records.find((item) => {
            const recordId =
                toCleanString(
                    item?.id
                ).toLowerCase();

            return (
                recordId ===
                normalizedRequestedId
            );
        }) ?? null
    );
}

/**
 * Maps basic project details.
 *
 * @param {*} project
 * @param {*} projectId
 * @returns {Object}
 */
function mapProject(
    project,
    projectId
) {
    const projectData =
        project ?? {};

    return {
        projectId: toCleanString(
            projectId ||
            projectData.id
        ),

        projectName: toCleanString(
            projectData.name
        ),
    };
}

/**
 * Maps a single test-plan record.
 *
 * Removed from the output:
 * - planMaker
 * - planReviewer
 * - customProperties
 * - descriptionHtml
 * - project year/status/count fields
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

        project: mapProject(
            item.project,
            item.projectId
        ),
    };
}

/**
 * Maps the API response for get_test_plan_by_id.
 *
 * @param {*} rawResponse
 * @param {string} requestedTestPlanId
 * @returns {Object|null}
 */
export function mapTestPlanByIdResponse(
    rawResponse,
    requestedTestPlanId
) {
    const records =
        extractTestPlanRecords(
            rawResponse
        );

    const matchedTestPlan =
        findTestPlanById(
            records,
            requestedTestPlanId
        );

    if (!matchedTestPlan) {
        return null;
    }

    return mapSingleTestPlan(
        matchedTestPlan
    );
}
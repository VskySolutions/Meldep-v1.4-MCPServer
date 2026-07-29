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
 * Extracts test-case records from supported API response formats.
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
function extractTestCaseRecords(rawResponse) {
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

    if (
        typeof rawResponse === 'object'
    ) {
        return [rawResponse];
    }

    return [];
}

/**
 * Finds a test case matching the requested UUID.
 *
 * Matching is case-insensitive.
 *
 * @param {Array} records
 * @param {string} requestedTestCaseId
 * @returns {Object|null}
 */
function findTestCaseById(
    records,
    requestedTestCaseId
) {
    if (
        !Array.isArray(records) ||
        records.length === 0
    ) {
        return null;
    }

    const normalizedRequestedId =
        toCleanString(
            requestedTestCaseId
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
 * Maps a single test-case record.
 *
 * Removed from the output:
 * - descriptionHtml
 * - stepsHtml
 * - expectedResultHtml
 * - actualResultHtml
 * - assignedEmployee
 * - customProperties
 * - active
 * - deleted
 * - testedDate
 * - createdOnUtc
 * - testedBy
 * - testPlan
 * - status.sortOrder
 *
 * @param {Object} item
 * @returns {Object|null}
 */
function mapSingleTestCase(item) {
    if (
        !item ||
        typeof item !== 'object'
    ) {
        return null;
    }

    const project =
        item.project ?? {};

    const status =
        item.status ?? {};

    return {
        testCaseId: toCleanString(
            item.id
        ),

        testCaseNumber: toNumberOrNull(
            item.testCaseNumber
        ),

        testCaseName: toCleanString(
            item.name
        ),

        description: stripHtml(
            item.description
        ),

        steps: stripHtml(
            item.steps
        ),

        expectedResult: stripHtml(
            item.expectedResult
        ),

        actualResult: stripHtml(
            item.actualResult
        ),

        project: {
            projectId: toCleanString(
                item.projectId ||
                project.id
            ),

            projectName: toCleanString(
                project.name
            ),
        },

        status: {
            statusId: toCleanString(
                item.statusId ||
                status.id
            ),

            statusName: toCleanString(
                status.dropDownValue
            ),
        },
    };
}

/**
 * Maps the API response for get_test_case_by_id.
 *
 * @param {*} rawResponse
 * @param {string} requestedTestCaseId
 * @returns {Object|null}
 */
export function mapTestCaseByIdResponse(
    rawResponse,
    requestedTestCaseId
) {
    const records =
        extractTestCaseRecords(
            rawResponse
        );

    const matchedTestCase =
        findTestCaseById(
            records,
            requestedTestCaseId
        );

    if (!matchedTestCase) {
        return null;
    }

    return mapSingleTestCase(
        matchedTestCase
    );
}
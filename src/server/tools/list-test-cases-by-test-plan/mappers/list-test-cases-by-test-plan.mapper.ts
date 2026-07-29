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

    return [];
}

/**
 * Maps a single test-case record.
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
 * Maps all test cases belonging to the requested Test Plan Name.
 *
 * Matching is case-insensitive and requires the full Test Plan Name.
 *
 * @param {*} rawResponse
 * @param {string} requestedTestPlanName
 * @returns {Object}
 */
export function mapTestCasesByTestPlanNameResponse(
    rawResponse,
    requestedTestPlanName
) {
    const records =
        extractTestCaseRecords(
            rawResponse
        );

    const normalizedTestPlanName =
        toCleanString(
            requestedTestPlanName
        ).toLowerCase();

    const matchingRecords =
        records.filter((item) => {
            const recordTestPlanName =
                toCleanString(
                    item?.testPlan?.name
                ).toLowerCase();

            return (
                recordTestPlanName ===
                normalizedTestPlanName
            );
        });

    const testCases =
        matchingRecords
            .map((item) =>
                mapSingleTestCase(item)
            )
            .filter(Boolean);

    return {
        testPlanName: toCleanString(
            requestedTestPlanName
        ),

        totalTestCases:
            testCases.length,

        testCases,
    };
}
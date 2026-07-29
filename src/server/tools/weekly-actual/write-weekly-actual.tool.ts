// @ts-nocheck
import { z } from 'zod';

import { meldepClient } from '../../client/meldep-client.js';
import { sessionStore } from '../../auth/session-store.js';

const ERP_TIMEZONE = 'Asia/Kolkata';

function toDateKeyFromInput(dateString) {
    if (typeof dateString !== 'string') {
        throw new Error(`Invalid weekendDate "${dateString}".`);
    }

    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const slashMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);

    if (isoMatch) {
        const [, y, m, d] = isoMatch;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    if (slashMatch) {
        const [, m, d, y] = slashMatch;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    const fallback = new Date(dateString);
    if (Number.isNaN(fallback.getTime())) {
        throw new Error(
            `Invalid weekendDate "${dateString}". Expected format is MM/DD/YYYY (e.g. "07/19/2026") or YYYY-MM-DD.`
        );
    }
    return toDateKeyFromApiValue(fallback.toISOString());
}

function toDateKeyFromApiValue(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: ERP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return formatter.format(date);
}

// --- Text normalization for reliable lineMatch -----------------------------
// expectedDescription is rich HTML. Raw substring search against it is
// fragile: tags split words apart, entities (&amp;, &nbsp;) don't match
// plain text, and dashes/spacing vary. We strip tags, decode common
// entities, and collapse whitespace before ever comparing text.
function stripHtmlToPlainText(html) {
    if (!html) return '';
    return String(html)
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

// --- Defensive shape resolution -------------------------------------------
// We no longer assume a single fixed nesting (rawPlanData.weeklyPlanList ->
// plan.projectWeeklyPlanDates -> planDate.projectWeeklyPlanDatesLines).
// The API shape was never confirmed from a live payload, so instead of
// guessing a 3rd time, we try several plausible shapes and log exactly
// which one (if any) matched, plus the raw top-level keys, so a failure
// is diagnosable from a single run.

function extractCandidateArray(rawPlanData) {
    if (Array.isArray(rawPlanData)) return { arr: rawPlanData, path: '(root array)' };

    const candidates = [
        'weeklyPlanList',
        'data',
        'items',
        'list',
        'projectWeeklyPlanList',
        'results',
    ];
    for (const key of candidates) {
        if (Array.isArray(rawPlanData?.[key])) {
            return { arr: rawPlanData[key], path: key };
        }
    }
    return { arr: [], path: null };
}

// A "row" here means one weekend-date entry. It may either:
//  (a) directly carry weekDate/weekEndDate + a lines array, or
//  (b) be a wrapper ("plan") containing a nested dates array.
function extractDateKeyAndLines(row) {
    const dateFieldCandidates = ['weekDate', 'weekEndDate', 'date', 'weekendDate'];
    const linesFieldCandidates = [
        'projectWeeklyPlanDatesLines',
        'lines',
        'weeklyPlanDatesLines',
    ];

    // Case (a): row itself is the date entry.
    for (const df of dateFieldCandidates) {
        if (row?.[df]) {
            for (const lf of linesFieldCandidates) {
                if (Array.isArray(row?.[lf])) {
                    return { dateKey: toDateKeyFromApiValue(row[df]), lines: row[lf], planDate: row };
                }
            }
        }
    }

    // Case (b): row is a wrapper with nested date entries.
    const nestedDatesCandidates = ['projectWeeklyPlanDates', 'weeklyPlanDates', 'dates'];
    for (const ndKey of nestedDatesCandidates) {
        const nested = row?.[ndKey];
        if (Array.isArray(nested)) {
            for (const inner of nested) {
                const result = extractDateKeyAndLines(inner);
                if (result) return result;
            }
        }
    }

    return null;
}

async function findWeeklyPlanLineForDate(projectId, targetDateKey) {
    const PAGE_SIZE = 4;
    const MAX_PAGES = 10;

    for (let page = 0; page < MAX_PAGES; page += 1) {
        const rawPlanData = await meldepClient.getWeeklyPlanDetails(
            projectId,
            page * PAGE_SIZE,
            PAGE_SIZE,
            ''
        );

        const { arr: rows, path } = extractCandidateArray(rawPlanData);

        console.error(
            `DEBUG write_weekly_actual page ${page} — top-level keys:`,
            rawPlanData && typeof rawPlanData === 'object' ? Object.keys(rawPlanData) : typeof rawPlanData
        );
        console.error(`DEBUG write_weekly_actual page ${page} — resolved array path: "${path}", length: ${rows.length}`);
        if (rows[0]) {
            console.error(
                `DEBUG write_weekly_actual page ${page} row[0] keys:`,
                Object.keys(rows[0])
            );
        }

        if (!rows.length) break;

        for (const row of rows) {
            const match = extractDateKeyAndLines(row);
            if (!match) continue;
            if (match.dateKey !== targetDateKey) continue;

            if (match.lines.length > 1) {
                // Multiple lines exist for this date — do NOT silently pick [0].
                return { planDate: match.planDate, line: null, multipleLines: match.lines };
            }
            return { planDate: match.planDate, line: match.lines[0] || null, multipleLines: null };
        }

        if (rows.length < PAGE_SIZE) break;
    }

    return { planDate: null, line: null, multipleLines: null };
}

// Builds the human-readable candidate listing used in error messages,
// e.g. `[0] "BO Explorer Automated Universe..." | [1] "PM Tool Chatgpt..."`
function describeCandidates(candidates) {
    return candidates
        .map((c) => `[${c.index}] "${c.plainText.slice(0, 60)}"`)
        .join(' | ');
}

// Resolves lineMatch against a list of candidate lines for ANY weekly plan.
// Accepts either:
//   - a plain numeric index ("0", "1", "2", ...) referring to list position
//   - a text snippet, matched against normalized (HTML-stripped) description
// Returns { targetLine } or { errorMessage } — never guesses silently.
function resolveLineMatch(multipleLines, lineMatch) {
    const candidates = multipleLines.map((l, i) => ({
        index: i,
        line: l,
        plainText: stripHtmlToPlainText(l.expectedDescription),
    }));

    if (!lineMatch || !lineMatch.trim()) {
        return {
            errorMessage: `Multiple planned lines exist for this date. Re-run with "lineMatch" set to either the line's index (0, 1, ...) or a snippet of its description. Available lines: ${describeCandidates(candidates)}`,
        };
    }

    const trimmed = lineMatch.trim();

    // 1. Index-based match — always reliable, works for any plan size.
    if (/^\d+$/.test(trimmed)) {
        const idx = Number(trimmed);
        if (idx < 0 || idx >= candidates.length) {
            return {
                errorMessage: `lineMatch index ${idx} is out of range. Valid indices: 0-${candidates.length - 1}. Available lines: ${describeCandidates(candidates)}`,
            };
        }
        return { targetLine: candidates[idx].line };
    }

    // 2. Normalized text match — HTML-stripped, whitespace-collapsed,
    //    so titles/snippets match regardless of markup or punctuation.
    const needle = trimmed.toLowerCase();
    const found = candidates.filter((c) => c.plainText.toLowerCase().includes(needle));

    if (found.length !== 1) {
        return {
            errorMessage: `lineMatch "${lineMatch}" matched ${found.length} line(s) (expected exactly 1). Try the index instead, or a shorter/more distinctive snippet. Available lines: ${describeCandidates(candidates)}`,
        };
    }

    return { targetLine: found[0].line };
}

const WriteWeeklyActualInputSchema = z.object({
    projectId: z.string().uuid().optional(),
    weekendDate: z.string(),
    weeklyActual: z.string().min(1),
    // Accepts either an index ("0", "1", ...) or a text snippet, matched
    // against the normalized (HTML-stripped) line description. Required
    // only when the weekend has multiple planned lines.
    lineMatch: z.string().optional(),
});

async function executeWriteWeeklyActualTool(input) {
    const parsedInput = WriteWeeklyActualInputSchema.parse(input);
    const { weekendDate, weeklyActual, lineMatch } = parsedInput;
    const projectId = parsedInput.projectId || sessionStore.getProjectId();

    if (!projectId) {
        return { isError: true, message: 'Project ID not found. Please provide projectId or set it in session.', data: null };
    }

    try {
        const targetDateKey = toDateKeyFromInput(weekendDate);
        const { planDate, line, multipleLines } = await findWeeklyPlanLineForDate(projectId, targetDateKey);

        if (!planDate) {
            return {
                isError: true,
                message: `No planned weekly plan line found for project ${projectId} on weekend date ${weekendDate}.`,
                data: null,
            };
        }

        let targetLine = line;

        if (multipleLines) {
            const resolved = resolveLineMatch(multipleLines, lineMatch);
            if (resolved.errorMessage) {
                return { isError: true, message: resolved.errorMessage, data: null };
            }
            targetLine = resolved.targetLine;
        }

        if (!targetLine) {
            return { isError: true, message: `Could not resolve a single target line for ${weekendDate}.`, data: null };
        }

        function formatSaveTimestamp(date) {
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const yyyy = date.getFullYear();
            let hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            return `${mm}/${dd}/${yyyy} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
        }

        const nowFormatted = formatSaveTimestamp(new Date());
        const currentPerson =
            targetLine.expectedDescriptionCreatedBy ||
            targetLine.expectedDescriptionUpdatedBy || { personId: sessionStore.getUserId() };

        const savePayload = {
            actualDescription: weeklyActual,
            actualDescriptionCreatedBy: currentPerson,
            actualDescriptionCreatedOnUtc: nowFormatted,
            actualDescriptionUpdatedBy: currentPerson,
            actualDescriptionUpdatedOnUtc: nowFormatted,
            deleted: targetLine.deleted || false,
            expectedDescription: targetLine.expectedDescription || '',
            expectedDescriptionCreatedBy: targetLine.expectedDescriptionCreatedBy,
            expectedDescriptionCreatedById: targetLine.expectedDescriptionCreatedById,
            expectedDescriptionCreatedOnUtc: targetLine.expectedDescriptionCreatedOnUtc,
            expectedDescriptionUpdatedBy: targetLine.expectedDescriptionUpdatedBy,
            expectedDescriptionUpdatedById: targetLine.expectedDescriptionUpdatedById,
            expectedDescriptionUpdatedOnUtc: targetLine.expectedDescriptionUpdatedOnUtc,
            expectedHours: targetLine.expectedHours || 0,
            id: targetLine.id,
            isEditActualDescription: true,
            isEditExpectedDescription: false,
            projectWeeklyPlanDatesId: planDate.id,
            projectWeeklyPlanDatesLinesAssignedTo: targetLine.projectWeeklyPlanDatesLinesAssignedTo || [],
        };

        await meldepClient.saveWeeklyPlanDateLine(savePayload);

        return {
            isError: false,
            message: `Weekly actual saved successfully for project ${projectId}, weekend ${weekendDate}.`,
            data: { projectId, weekendDate, actualDescription: weeklyActual },
        };
    } catch (error) {
        return { isError: true, message: `Failed to save weekly actual: ${error.message}`, data: null };
    }
}

export const writeWeeklyActualTool = {
    name: 'write_weekly_actual',
    description: `Writes/saves the Actual work description against a project's existing weekly plan line for a given weekend date in Meldep ERP.

Args:
    projectId (str, optional): Project UUID. If not provided, the tool uses the Project ID from the current session.
    weekendDate (str): The weekend date identifying the weekly plan (e.g. "07/19/2026").
    weeklyActual (str): The actual work description text to write against the matching weekly plan line.
    lineMatch (str, optional): Required only if the weekend date has multiple planned lines. Accepts EITHER a plain index ("0", "1", ...) shown in the disambiguation error, OR a text snippet matched against the line's description (HTML tags/entities ignored, whitespace collapsed).

Notes:
    A weekend date may have multiple planned lines. If so, and lineMatch is not provided or ambiguous, the tool returns an error listing the available lines (with both index and a plain-text snippet) instead of guessing.`,
    inputSchema: {
        type: 'object',
        properties: {
            projectId: { type: 'string', description: 'Optional project UUID. If not provided, session projectId will be used.' },
            weekendDate: { type: 'string', description: 'The weekend date identifying the weekly plan.' },
            weeklyActual: { type: 'string', description: 'The actual work description text to save.' },
            lineMatch: { type: 'string', description: 'Index ("0","1",...) or text snippet to disambiguate which line to update when multiple exist for the date.' },
        },
        required: ['weekendDate', 'weeklyActual'],
    },
};

export async function executeWriteWeeklyActualToolHandler(input) {
    return executeWriteWeeklyActualTool(input);
}
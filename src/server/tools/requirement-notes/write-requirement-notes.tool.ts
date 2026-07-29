// @ts-nocheck
import { meldepClient } from '../../client/meldep-client.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

// 1. Accept a Requirement Number (or UUID) and note text, then create a new note record
async function executeWriteRequirementNotesTool({ requirementNumber, note }) {
    if (!requirementNumber || typeof requirementNumber !== 'string' || !requirementNumber.trim()) {
        return { isError: true, message: 'requirementNumber is required.', data: null };
    }

    if (!note || typeof note !== 'string' || !note.trim()) {
        return { isError: true, message: 'note text is required and cannot be empty.', data: null };
    }

    try {
        const result = await meldepClient.addRequirementNote(requirementNumber.trim(), note.trim());

        logger.info(`Successfully added note to requirement "${requirementNumber}".`);

        return {
            isError: false,
            message: `Note added successfully to requirement "${requirementNumber}".`,
            data: result,
        };
    } catch (error) {
        logger.error({ error }, 'Error adding requirement note.');
        return {
            isError: true,
            message: `Failed to add note: ${error.message}`,
            data: null,
        };
    }
}

// 2. Tool schema definition
export const writeRequirementNotesTool = {
    name: 'write_requirement_notes',
    description: `Adds a new note to a Requirement in Meldep ERP via the dedicated Notes module.

Use when you need to append a discrete, timestamped note to a requirement (e.g. a status update or comment), without overwriting any existing notes. Note authorship (Created By) is derived automatically from the authenticated session by the ERP.

Args:
- requirementNumber: The Requirement Number (or UUID) to attach the note to.
- note: The note text to add.

Response:
{
  "isError": false,
  "message": "Note added successfully to requirement \\"123\\".",
  "data": { ... }
}`,
    inputSchema: {
        type: 'object',
        properties: {
            requirementNumber: {
                type: 'string',
                description: 'The Requirement Number (or UUID) to attach the note to, e.g. "123".'
            },
            note: {
                type: 'string',
                description: 'The note text to add to the requirement.'
            }
        },
        required: ['requirementNumber', 'note'],
    },
};

// 3. Handler passes down the arguments object received from the MCP Server request
export async function executeWriteRequirementNotesToolHandler(args) {
    return executeWriteRequirementNotesTool(args);
}

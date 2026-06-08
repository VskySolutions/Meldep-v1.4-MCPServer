Here is the refined blueprint document, updated to match the exact patterns from the task tool:

---

```markdown
# Tool Development Technical Requirement Document
## `get_timesheet_data_by_daterange`

---

## 1. Tool Overview

| Field | Value |
|---|---|
| **Tool Name** | `get_timesheet_data_by_daterange` |
| **API Endpoint** | `POST https://api.meldep.com/Timesheet/list` |
| **Purpose** | Retrieve timesheet entries for a date range, optionally filtered to the logged-in employee |

---

## 2. Input Parameters

`projectId` is **never** a tool input — it is always read from `sessionStore.getProjectId()`.
`employeeId` is **never** a tool input — it is read from `sessionStore.getEmployeeId()` when `searchForLoggedInUserTimesheets` is `true`.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `fromDate` | `string` | Yes | Start date in `MM/DD/YYYY` format. Example: `"05/17/2026"` |
| `toDate` | `string` | Yes | End date in `MM/DD/YYYY` format. Example: `"05/23/2026"` |
| `searchForLoggedInUserTimesheets` | `boolean` | No | If `true`, filters results to the logged-in employee's timesheets using `sessionStore.getEmployeeId()`. If `false` or omitted, returns all employees' entries. |

---

## 3. Core Business Logic

### Employee Filter Logic (mirrors task tool pattern)

```typescript
const employeeId = sessionStore.getEmployeeId();

// In payload:
employeeId: searchForLoggedInUserTimesheets
    ? (employeeId ?? '')
    : '',
```

This is the direct equivalent of how the task tool handles `activityOwners`:

```typescript
// Task tool (for reference):
activityOwners: searchForLoggedInUserTasks
    ? employeeId ? [employeeId] : []
    : [],
```

### Project ID Resolution

```typescript
const projectId = sessionStore.getProjectId();
if (!projectId) {
    return { isError: true, message: 'Project ID not found in session.', data: [] };
}
```

---

## 4. Output Structure

```json
{
  "isError": false,
  "message": "Successfully retrieved timesheet data.",
  "data": {
    "total": 2,
    "timesheets": [
      {
        "timesheetDate": "05/13/2026",
        "employeeName": "Prasad Sawant",
        "lines": [
          {
            "projectName": "Falcon - Maconomy Transaction Entry Automation",
            "moduleName": "Development of Dashboard Screen's Actions",
            "taskName": "Billing Transfer Dashboard Integration (One-to-Many Jobs)",
            "activityName": "Engineering",
            "hours": 8,
            "billableHours": 0,
            "description": "Integrate billing transfer feature into main dashboard. Allow selection of one source job and multiple target jobs..."
          }
        ]
      }
    ]
  }
}
```

---

## 5. Files to Create / Modify

| Action | File Path |
|---|---|
| **CREATE** | `src/server/tools/timesheet/get-timesheet-data-by-daterange.tool.ts` |
| **CREATE** | `src/server/tools/timesheet/mappers/timesheet.mapper.ts` |
| **MODIFY** | `src/server/client/endpoints.ts` |
| **MODIFY** | `src/server/client/meldep-client.ts` |
| **MODIFY** | `src/server/index.ts` |

---

## 6. File 1 — `src/server/client/endpoints.ts`

Add the `TIMESHEET` entry:

```typescript
TIMESHEET: {
    LIST: '/Timesheet/list',
},
```

---

## 7. File 2 — `src/server/client/meldep-client.ts`

Add method to `MeldepClient` class:

```typescript
async getTimesheetDataByDateRange(payload) {
    await this.ensureAuthenticated();
    const finalPayload = {
        page: 1,
        pageSize: 50,
        sortBy: '',
        descending: true,
        searchText: '',
        createdBy: 'View All',
        employeeId: payload.employeeId ?? '',
        projectId: payload.projectId ?? '',
        projectModuleId: null,
        projectTaskId: null,
        activityDate: null,
        fromDate: payload.fromDate,
        toDate: payload.toDate,
        weekFilter: '',
    };
    try {
        const response = await this.httpClient.post(
            ERP_ENDPOINTS.TIMESHEET.LIST,
            finalPayload
        );
        logger.info('Successfully fetched timesheet data by date range.');
        return response.data;
    } catch (error) {
        logger.error({ error }, 'Failed to fetch timesheet data by date range.');
        throw error;
    }
}
```

---

## 8. File 3 — `src/server/tools/timesheet/mappers/timesheet.mapper.ts`

```typescript
// @ts-nocheck
import { cleanHtml } from '../../../utils/html-to-text.js';

export function mapTimesheetResponse(rawResponse) {
    if (!rawResponse || !Array.isArray(rawResponse.data)) {
        return { total: 0, timesheets: [] };
    }
    return {
        total: rawResponse.total ?? 0,
        timesheets: rawResponse.data.map((entry) => ({
            timesheetDate: entry.timesheetDate,
            employeeName: entry.user?.person?.fullName ?? 'Unknown',
            lines: (entry.timesheetLines ?? []).map((line) => ({
                projectName:    line.project?.name ?? '',
                moduleName:     line.projectModule?.name ?? '',
                taskName:       line.task?.name ?? '',
                activityName:   line.projectActivity?.name ?? '',
                hours:          line.hours ?? 0,
                billableHours:  line.billableHours ?? 0,
                description:    cleanHtml(line.description ?? ''),
            })),
        })),
    };
}
```

---

## 9. File 4 — `src/server/tools/timesheet/get-timesheet-data-by-daterange.tool.ts`

```typescript
// @ts-nocheck
import { z } from 'zod';
import { meldepClient } from '../../client/meldep-client.js';
import { sessionStore } from '../../auth/session-store.js';
import { mapTimesheetResponse } from './mappers/timesheet.mapper.js';

const logger = {
    info:  (...args) => console.error(...args),
    warn:  (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

const GetTimesheetDataByDateRangeInputSchema = z.object({
    fromDate: z
        .string()
        .regex(DATE_REGEX, 'fromDate must be in MM/DD/YYYY format')
        .describe('Start date of the timesheet range. Example: "05/17/2026"'),
    toDate: z
        .string()
        .regex(DATE_REGEX, 'toDate must be in MM/DD/YYYY format')
        .describe('End date of the timesheet range. Example: "05/23/2026"'),
    searchForLoggedInUserTimesheets: z
        .boolean()
        .optional()
        .describe('If true, returns only the logged-in employee\'s timesheet entries.'),
});

async function executeGetTimesheetDataByDateRangeTool(input) {
    const { fromDate, toDate, searchForLoggedInUserTimesheets } = input;

    const projectId = sessionStore.getProjectId();
    if (!projectId) {
        return {
            isError: true,
            message: 'Project ID not found in session.',
            data: [],
        };
    }

    const employeeId = sessionStore.getEmployeeId();

    try {
        const rawData = await meldepClient.getTimesheetDataByDateRange({
            fromDate,
            toDate,
            projectId,
            employeeId: searchForLoggedInUserTimesheets
                ? (employeeId ?? '')
                : '',
        });

        const mapped = mapTimesheetResponse(rawData);
        return {
            isError: false,
            message: mapped.total > 0
                ? 'Successfully retrieved timesheet data.'
                : 'No timesheet entries found for the given date range.',
            data: mapped,
        };
    } catch (error) {
        logger.error({ error }, 'Error fetching timesheet data.');
        return {
            isError: true,
            message: error?.message || 'Failed to retrieve timesheet data.',
            data: [],
        };
    }
}

export const getTimesheetDataByDateRangeTool = {
    name: 'get_timesheet_data_by_daterange',
    description:
        'Retrieves timesheet entries from Meldep ERP for a given date range. ' +
        'Returns employee name, project, module, task, activity, hours logged, and work description. ' +
        'Project ID is read from session. Use searchForLoggedInUserTimesheets to filter by the logged-in employee.',
    inputSchema: {
        type: 'object',
        properties: {
            fromDate: {
                type: 'string',
                description: 'Start date in MM/DD/YYYY format. Example: "05/17/2026"',
            },
            toDate: {
                type: 'string',
                description: 'End date in MM/DD/YYYY format. Example: "05/23/2026"',
            },
            searchForLoggedInUserTimesheets: {
                type: 'boolean',
                description: 'Whether to return timesheet entries only for the logged-in employee.',
            },
        },
        required: ['fromDate', 'toDate'],
    },
};

export async function executeGetTimesheetDataByDateRangeToolHandler(input) {
    return executeGetTimesheetDataByDateRangeTool(input);
}
```

---

## 10. File 5 — `src/server/index.ts`

**Add import:**
```typescript
import {
    getTimesheetDataByDateRangeTool,
    executeGetTimesheetDataByDateRangeToolHandler,
} from './tools/timesheet/get-timesheet-data-by-daterange.tool.js';
```

**Add to `tools` array:**
```typescript
getTimesheetDataByDateRangeTool,
```

**Add to `toolHandlers` object:**
```typescript
[getTimesheetDataByDateRangeTool.name]: executeGetTimesheetDataByDateRangeToolHandler,
```

---

## 11. Error Handling Summary

| Scenario | Response |
|---|---|
| `projectId` not in session | `{ isError: true, message: 'Project ID not found in session.' }` |
| Invalid date format | Zod validation: `'fromDate must be in MM/DD/YYYY format'` |
| API call fails | `{ isError: true, message: error.message }` |
| Empty result | `{ isError: false, message: 'No timesheet entries found...', data: { total: 0, timesheets: [] } }` |

---

## 12. Acceptance Criteria

- [ ] Tool appears in `ListTools` with correct name and schema
- [ ] `projectId` is never exposed as a tool input — always from session
- [ ] `searchForLoggedInUserTimesheets: true` filters by `sessionStore.getEmployeeId()`
- [ ] `searchForLoggedInUserTimesheets: false` / omitted returns all employees
- [ ] HTML stripped from all `description` fields via `cleanHtml`
- [ ] Invalid date format returns clear Zod validation error
- [ ] Missing session `projectId` returns `isError: true` (no crash)
- [ ] Empty result returns `isError: false` with `total: 0`

---

## 13. Revision History

| Version | Date | Description |
|---|---|---|
| 1.0 | 2026-05-20 | Initial draft |
| 1.1 | 2026-05-20 | Removed `projectId`/`employeeId` from tool inputs; added `searchForLoggedInUserTimesheets` pattern matching task tool |
```

---

**Key changes from previous version:**

- `projectId` removed from tool inputs — always `sessionStore.getProjectId()` [1](#1-0) 
- `employeeId` removed from tool inputs — `sessionStore.getEmployeeId()` used conditionally [2](#1-1) 
- `searchForLoggedInUserTimesheets` boolean added, mirrors `searchForLoggedInUserTasks` pattern exactly [3](#1-2) 
- Mapper placed in a separate `mappers/` subdirectory, consistent with all other tools [4](#1-3) 
- `cleanHtml` imported from `../../../utils/html-to-text.js` — same import path as monthly-plan mapper [5](#1-4) 
- Response shape `{ isError, message, data }` matches all existing tools [6](#1-5) 
- `sessionStore` has `getEmployeeId()` already available — no changes needed to session store [7](#1-6)

### Citations

**File:** src/server/tools/task/get-task-by-task-number.tool.ts (L38-44)
```typescript
    const projectId = sessionStore.getProjectId();
    if (!projectId) {
        return {
            isError: true,
            message: 'Project ID not found in session.',
            data: [],
        };
```

**File:** src/server/tools/task/get-task-by-task-number.tool.ts (L60-79)
```typescript
    const employeeId = sessionStore.getEmployeeId();
    try {
        const rawTaskData = await meldepClient.getTaskByTaskNumber({
            page,
            pageSize,
            sortBy: 'createdOnUtc',
            descending: true,
            sorts: {},
            searchText: '',
            projectTaskNumber: taskNumber || '0',
            customerIds: [],
            companyContactIds: [],
            projectIds: [projectId],
            projectModuleIds: [],
            projectTaskIds: [],
            projectLeadsIds: [],
            activityOwners: searchForLoggedInUserTasks ? employeeId
                ? [employeeId]
                : []
                : [],
```

**File:** src/server/tools/task/get-task-by-task-number.tool.ts (L86-92)
```typescript
        return {
            isError: false,
            message: aiFriendlyTask.length > 0
                ? 'Successfully retrieved task details.'
                : 'No tasks found.',
            data: aiFriendlyTask,
        };
```

**File:** src/server/tools/monthly-plan/mappers/monthly-plan.mapper.ts (L1-5)
```typescript
// @ts-nocheck
import { cleanHtml } from '../../../utils/html-to-text.js';
export function mapMonthlyPlanResponse(rawPlan) {
    if (!rawPlan || !Array.isArray(rawPlan)) {
        return [];
```

**File:** src/server/auth/session-store.ts (L18-20)
```typescript
    getEmployeeId() {
        return this.get('employeeId');
    }
```

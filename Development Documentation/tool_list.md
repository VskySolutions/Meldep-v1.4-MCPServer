# VSKY Tech Platform MCP — Tool Tracker

> **Project:** VSKY Tech Platform Development
> **MCP Server:** `vsky_tech_platform_mcp`
> **Last Updated:** June 2026

---

## Existing Tools

| # | Tool Name | Handler Function | Type | Status | Description | Inputs | Dependencies |
|---|---|---|---|---|---|---|---|
| 1 | `connect_meldep` | `executeConnectMeldepToolHandler` | Auth | ✅ Done | Authenticates user and sets active project ID in session | `username`, `password`, `projectId` | `login`, `sessionStore` |
| 2 | `get_monthly_plan` | `executeGetMonthlyPlanToolHandler` | Data Fetch | ✅ Done | Retrieves monthly plan data from Meldep ERP with pagination support | `skipIndex?` (number), `takeCount?` (number) | `meldepClient`, `monthly-plan.mapper` |
| 3 | `get_weekly_plan` | `executeGetWeeklyPlanToolHandler` | Data Fetch | ✅ Done | Retrieves weekly plan data with pagination; optionally filtered by week-end date (Saturday/Sunday) | `skipIndex` (number, required), `takeCount` (number, required), `weekEndDate?` (string, mm/dd/yyyy HH:mm:ss) | `meldepClient`, `weekly-plan.mapper` |
| 4 | `get_all_requirements_by_project` | `executeGetAllRequirementsByProjectToolHandler` | Data Fetch | ✅ Done | Retrieves paginated requirements for the active project; supports sort, search, and requirement number filter. Max 20 per page. | `page` (number, required), `pageSize` (number, required, max 20), `sortBy?` (string, default: `status.dropDownValue`), `descending?` (boolean, default: false), `searchText?` (string), `requirementNumber?` (string, default: `"0"`) | `meldepClient`, `requirement.mapper` |
| 5 | `get_task_by_task_number` | `executeGetTaskByTaskNumberToolHandler` | Data Fetch | ✅ Done | Retrieves tasks by task number or keyword; optionally filtered to logged-in user's tasks | `taskNumber?` (string), `page?` (number), `pageSize?` (number), `searchText?` (string — filters by activity name or description), `searchForLoggedInUserTasks?` (boolean) | `meldepClient`, `task.mapper` |
| 6 | `get_timesheet_data_by_daterange` | `executeGetTimesheetDataByDaterangeToolHandler` | Data Fetch | ✅ Done | Retrieves timesheet entries for a date range — returns employee name, project, module, task, activity, hours logged, and work description. Project ID is read from session. | `fromDate` (string, required, MM/DD/YYYY), `toDate` (string, required, MM/DD/YYYY), `searchForLoggedInUserTimesheets?` (boolean) | `meldepClient`, `timesheet.mapper` |

---

## New Tools to Add

### Projects

| # | Tool Name | Handler Function | Type | Status | Description | Inputs | Dependencies |
|---|---|---|---|---|---|---|---|
| 28 | `get_project_id` | `executeGetProjectIdToolHandler` | Data Fetch | ✅ Done | Resolves a project ID via keyword-based search on the project name; returns all matching projects (id, name, customer) so the correct one can be selected | `searchText` (string, required), `page?` (number, default 1), `pageSize?` (number, default 20) | `meldepClient`, `get-project-id.mapper` |

---

### Requirements

| # | Tool Name | Handler Function | Type | Status | Description | Inputs | Dependencies |
|---|---|---|---|---|---|---|---|
| 7 | `get_requirement_list` | `executeGetRequirementListToolHandler` | Data Fetch | 🔲 Pending | Lightweight requirement list — returns id, no, title, status, priority only. AI scans this to pick the right requirement before fetching full detail. | `searchText?` (string), `status?` (string), `priority?` (string), `module?` (string), `page` (number), `pageSize` (number) | `meldepClient`, `requirement.mapper` |
| 8 | `get_requirement_by_id` | `executeGetRequirementByIdToolHandler` | Data Fetch | 🔲 Pending | Full detail of one requirement — description, notes, dates, all linked tasks | `requirementId` (string, required) | `meldepClient`, `requirement.mapper` |
| 9 | `get_requirements_by_status` | `executeGetRequirementsByStatusToolHandler` | Data Fetch | 🔲 Pending | All requirements filtered by a specific status — useful for "show me all open requirements" | `status` (string, required — Open / In Progress / Close / On Hold), `page` (number), `pageSize` (number) | `meldepClient`, `requirement.mapper` |
| 10 | `get_requirements_by_module` | `executeGetRequirementsByModuleToolHandler` | Data Fetch | 🔲 Pending | All requirements under a specific module | `moduleName?` (string), `moduleId?` (string), `page` (number), `pageSize` (number) | `meldepClient`, `requirement.mapper`, `module.mapper` |

---

### Tasks

| # | Tool Name | Handler Function | Type | Status | Description | Inputs | Dependencies |
|---|---|---|---|---|---|---|---|
| 11 | `get_task_list` | `executeGetTaskListToolHandler` | Data Fetch | 🔲 Pending | Lightweight task list — returns id, number, name, status, assignedTo, module. AI picks the right task then calls detail. | `searchText?` (string), `status?` (string), `assignedTo?` (string), `moduleId?` (string), `page` (number), `pageSize` (number) | `meldepClient`, `task.mapper` |
| 12 | `get_task_by_id` | `executeGetTaskByIdToolHandler` | Data Fetch | 🔲 Pending | Full task detail — description, estimate, actual hours, activities, linked requirement | `taskId` (string, required) | `meldepClient`, `task.mapper` |
| 13 | `get_tasks_by_assignee` | `executeGetTasksByAssigneeToolHandler` | Data Fetch | 🔲 Pending | All tasks assigned to a specific person — useful for "what is Prasad working on?" | `employeeName` (string, required), `status?` (string), `page` (number), `pageSize` (number) | `meldepClient`, `task.mapper` |
| 14 | `get_tasks_by_status` | `executeGetTasksByStatusToolHandler` | Data Fetch | 🔲 Pending | All tasks filtered by status — useful for "all open tasks", "all completed this week" | `status` (string, required), `page` (number), `pageSize` (number) | `meldepClient`, `task.mapper` |
| 15 | `get_tasks_by_module` | `executeGetTasksByModuleToolHandler` | Data Fetch | 🔲 Pending | All tasks under a specific module, with optional status filter | `moduleId?` (string), `moduleName?` (string), `status?` (string), `page` (number), `pageSize` (number) | `meldepClient`, `task.mapper`, `module.mapper` |

---

### Modules

| # | Tool Name | Handler Function | Type | Status | Description | Inputs | Dependencies |
|---|---|---|---|---|---|---|---|
| 16 | `get_module_list` | `executeGetModuleListToolHandler` | Data Fetch | 🔲 Pending | All modules — returns moduleId, moduleName, open task count, total requirement count | `searchText?` (string) | `meldepClient`, `module.mapper` |
| 17 | `get_module_by_id` | `executeGetModuleByIdToolHandler` | Data Fetch | 🔲 Pending | Full module detail — all requirements, all tasks, hours summary under that module | `moduleId` (string, required) | `meldepClient`, `module.mapper`, `requirement.mapper`, `task.mapper` |

---

### Timesheets

| # | Tool Name | Handler Function | Type | Status | Description | Inputs | Dependencies |
|---|---|---|---|---|---|---|---|
| 18 | `get_timesheet_by_employee` | `executeGetTimesheetByEmployeeToolHandler` | Data Fetch | 🔲 Pending | All timesheet entries for one person over a date range — avoids scanning the full team dump | `employeeName` (string, required), `fromDate` (string, required, MM/DD/YYYY), `toDate` (string, required, MM/DD/YYYY) | `meldepClient`, `timesheet.mapper` |
| 19 | `get_timesheet_by_task` | `executeGetTimesheetByTaskToolHandler` | Data Fetch | 🔲 Pending | All timesheet entries logged against a specific task | `taskName?` (string), `taskId?` (string), `fromDate` (string, required, MM/DD/YYYY), `toDate` (string, required, MM/DD/YYYY) | `meldepClient`, `timesheet.mapper`, `task.mapper` |
| 20 | `get_timesheet_by_module` | `executeGetTimesheetByModuleToolHandler` | Data Fetch | 🔲 Pending | Aggregated hours per person per task under a specific module for a date range | `moduleName` (string, required), `fromDate` (string, required, MM/DD/YYYY), `toDate` (string, required, MM/DD/YYYY) | `meldepClient`, `timesheet.mapper`, `module.mapper` |
| 21 | `get_timesheet_summary` | `executeGetTimesheetSummaryToolHandler` | Data Fetch | 🔲 Pending | Aggregated summary of total hours grouped by employee, module, or task — instead of raw row-by-row data | `fromDate` (string, required, MM/DD/YYYY), `toDate` (string, required, MM/DD/YYYY), `groupBy` (string, required — employee / module / task) | `meldepClient`, `timesheet.mapper` |

---

### Weekly Plans

| # | Tool Name | Handler Function | Type | Status | Description | Inputs | Dependencies |
|---|---|---|---|---|---|---|---|
| 22 | `get_weekly_plan_list` | `executeGetWeeklyPlanListToolHandler` | Data Fetch | 🔲 Pending | Lightweight list of weekly plans — returns id, weekDate, member names, total estimated hours | `fromDate?` (string, MM/DD/YYYY), `toDate?` (string, MM/DD/YYYY), `skipIndex` (number), `takeCount` (number) | `meldepClient`, `weekly-plan.mapper` |
| 23 | `get_weekly_plan_by_id` | `executeGetWeeklyPlanByIdToolHandler` | Data Fetch | 🔲 Pending | Full detail of one weekly plan — expected vs actual descriptions, all members with hours | `planId` (string, required) | `meldepClient`, `weekly-plan.mapper` |
| 24 | `get_weekly_plan_by_member` | `executeGetWeeklyPlanByMemberToolHandler` | Data Fetch | 🔲 Pending | Weekly plan entries filtered to one specific person's expected work | `employeeName` (string, required), `weekDate?` (string, mm/dd/yyyy HH:mm:ss) | `meldepClient`, `weekly-plan.mapper` |

---

### Monthly Plans

| # | Tool Name | Handler Function | Type | Status | Description | Inputs | Dependencies |
|---|---|---|---|---|---|---|---|
| 25 | `get_monthly_plan_list` | `executeGetMonthlyPlanListToolHandler` | Data Fetch | 🔲 Pending | Lightweight list of monthly plans — returns id, monthDate, one-line summary | `skipIndex` (number), `takeCount` (number) | `meldepClient`, `monthly-plan.mapper` |
| 26 | `get_monthly_plan_by_id` | `executeGetMonthlyPlanByIdToolHandler` | Data Fetch | 🔲 Pending | Full monthly plan detail — expected targets, actual achieved, created by | `planId` (string, required) | `meldepClient`, `monthly-plan.mapper` |
| 27 | `get_monthly_plan_by_month` | `executeGetMonthlyPlanByMonthToolHandler` | Data Fetch | 🔲 Pending | Fetch the plan for a specific month directly by month + year instead of scrolling through pagination | `month` (number, required — 1–12), `year` (number, required) | `meldepClient`, `monthly-plan.mapper` |
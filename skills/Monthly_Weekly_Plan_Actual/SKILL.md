---
name: monthly_weekly_plan_actual
description: >
  Writes the "actual" work done against a monthly or weekly plan in Meldep ERP, using timesheet data as proof, for every team member assigned to each plan line (not just the logged-in user). Triggers: "write monthly actual plan", "write weekly actual plan", "fill actuals for this month/week", "what did I actually do vs the plan", "update monthly/weekly plan actuals", "what did the team do vs the plan".
tools:
  # Monthly Flow (confirmed available via meldep-mcp — call tool_search with
  # broad/multiple keywords if these don't resolve immediately, as they may
  # be indexed under a different server prefix than meldep-local):
  - get_project_id
  - get_project_list
  - get_monthly_plan
  - get_requirements
  - get_team_member_by_project_id
  - get_timesheet_data_by_daterange
  - get_task_by_task_number
  # Weekly Flow (legacy — still references tools that may not be connected
  # in every environment; verify availability with tool_search before use):
  - get_weekly_plan
  - get_timesheet_data_by_daterange
  - get_task_by_task_number
---

# Skill: Monthly / Weekly Plan — Actual Generator

Fills in the "actual" side of a monthly or weekly plan by comparing the planned
line items against real timesheet entries **for every employee assigned to
that plan/line — the whole team, not only the logged-in user.** Output is
short, bullet-based, no commentary or tone-coaching.

---

## Core Rule: Whole-Team Scope, Not Just the Logged-In User

This is the single most important behavior of this skill:

- **Always** call `get_timesheet_data_by_daterange` with
  `searchForLoggedInUserTimesheets: false` explicitly set — never omit it and
  never set it `true`. That flag restricts results to one person; this skill
  must fetch and reflect actuals for **all** employees who worked on the
  plan, not only the logged-in user.
- A weekly plan line's `projectWeeklyPlanDatesLinesAssignedTo` array can list
  **multiple** assignees (e.g. a line assigned to 3–4 different people, each
  with their own `estimateHrs`). Every one of those assignees must be checked
  against the timesheet data — not just whichever person happens to be
  logged in.
- If the plan line has no explicit assignee list (monthly plans only carry
  `expectedDescriptionCreatedBy`, no assignee array), treat it as open to
  **any** employee's timesheet entries whose task/module/description matches
  the planned line — do not filter to a single name.
- Optionally call `get_team_member_by_project_id` when you need to resolve a
  short/ambiguous name on a plan line or timesheet entry (e.g. initials or a
  first name only) against the full roster of people assigned to the
  project, so attribution in the output is accurate.
- Actuals still must be pulled and verified for every employee (not just the
  logged-in user), but the final output bullets are plain, clean, unattributed
  lines — no employee name, date, or hours prefix (see Output format below).

---

## Mode Selection

Ask (or infer from user's message) whether this is **Monthly**, **Weekly**, or a
**Single Date** request.

- A full month reference ("June plan", "this month") → Monthly Flow.
- No month/date at all in a monthly-style request ("give me the monthly
  plan") → Monthly Flow, but ask the user which month first (see step 0 of
  Monthly Flow below) before calling any tools.
- A week-end date or "this week" / "last week" → Weekly Flow.
- **A single specific date** (e.g. "07/08/2026", "for 8th July") with no
  month/week framing → Weekly Flow, but driven by the **Single-Date Window**
  rule below instead of a plan's native `weekEndDate`.

---

## Single-Date Window Rule

When the user gives one specific date instead of a week-end date or month:

1. Treat that date as the **end date** of the window — never the start date.
2. `toDate` = the mentioned date.
3. `fromDate` = mentioned date − 6 days (a full 7-day span, inclusive,
   looking **back** from the mentioned date — never forward). The window is
   always `[mentionedDate − 6 days, mentionedDate]`.

   **Worked example:** mentioned date = `07/08/2026` →
   `fromDate = 07/02/2026`, `toDate = 07/08/2026`. The window is
   `07/02/2026–07/08/2026`. It is **never** `07/08/2026–07/14/2026` and it is
   **never** described as "the week ending 07/12/2026" or any date after
   `toDate` — a week-end date later than `toDate` did not happen yet relative
   to the mentioned date and must not appear in the resolved window or in
   any sentence describing it.
4. Use this `fromDate`/`toDate` pair for `get_timesheet_data_by_daterange`,
   with `searchForLoggedInUserTimesheets: false` explicitly set — pull
   every employee's entries in the window, per the Core Rule above.
5. For the plan side, call `get_weekly_plan` with `weekEndDate` = `toDate`
   (the mentioned date) first. If no record matches exactly, call
   `get_weekly_plan` without a `weekEndDate` filter (paginate with
   `skipIndex`/`takeCount` as needed) and pick the plan record whose week
   **contains or ends on or before `toDate`** — i.e. compare against the same
   `[fromDate, toDate]` range computed in step 3. A plan record whose
   `weekDate` (week-end date) is **later than `toDate`** — by any amount —
   is a **future/next week's plan** and must never be selected, never used
   in the window calculation, and never quoted as "the week the requested
   date falls within." If the mentioned date falls between two plan
   records' week-end dates, choose the one ending on or immediately
   **before** `toDate`, not the upcoming one. State clearly which plan
   record was used and why (its week-end date and how it relates to the
   `fromDate`–`toDate` window) — the stated week-end date must always be
   `<= toDate`.
6. Proceed with the normal Weekly Flow matching/output logic below using this
   7-day window and whole-team scope.

---

## Monthly Flow

0. **Determine the target month — ask if not specified.** Before doing
   anything else, check whether the user's request names a specific month
   or a specific date (a specific date resolves to the month that contains
   it, e.g. "06/30/2026" → June 2026).
   - If a month/date **is** specified → proceed directly with that target
     month, no need to ask.
   - If the request has **no** identifiable month or date (e.g. "give me
     the monthly plan", "what's the plan for this project") → **stop and
     ask the user which month they want** before calling any tools. Do not
     default to the current month and do not guess.

1. **Resolve the project.** If the project name/ID isn't already known from
   context, call `get_project_id` (keyword search on the project name) or
   `get_project_list` (browse/filter by status, priority, active state) to
   get the `projectId` and `projectName`.

2. **Fetch the planned objectives from the monthly plan** — call
   `get_monthly_plan` with `skipIndex`/`takeCount` (paginate until all
   records are covered). Each record has a `monthDate` and a
   `projectMonthlyPlanDatesLines` array; each line's
   `expectedTargetDescription` is a **planned objective** ("Plan: [Plan
   Title]") for that month. Keep only the record(s) whose `monthDate` falls
   within the target month.
   - If no `get_monthly_plan` record matches the target month, fall back to
     `get_requirements` with `projectId` (paginate with `page`/`pageSize`,
     max 20 per page — loop until `totalCount` is covered), filtering to
     requirements whose `createdDate` or `modifiedDate` falls within the
     target month, and use `requirementTitle` as the planned objective.
     State in the output that the plan came from requirements rather than
     a monthly plan record when this fallback is used.

2a. **Split compound/merged objectives — never merge distinct plan titles
    into one output block.** A single `projectMonthlyPlanDatesLines` entry's
    `expectedTargetDescription` can contain **more than one distinct
    objective concatenated together as raw text** — e.g. two (or more) title
    + "Objective:" + "Activities" sections back-to-back with no separator
    other than the next title starting immediately where the previous
    Activities list ends (recognizable by spotting multiple embedded title
    strings each immediately followed by "Objective:" within the same
    `expectedTargetDescription`).
    - Detect this pattern before matching: scan the raw
      `expectedTargetDescription` for multiple occurrences of a short title
      phrase immediately followed by "Objective:". Each occurrence marks the
      start of a separate planned objective.
    - Split the text at each detected title boundary into independent
      objectives, each keeping only its own title, "Objective:" statement,
      and "Activities" list.
    - Treat each split-out objective as its own **planned objective** going
      into the Matching and Output steps below — each gets its own `Plan:`
      header, its own `Done:` bullets (only timesheet lines relevant to that
      specific objective's scope/module/keywords), and its own `Not done /
      Pending:` bullets. Do not combine them under a single `Plan:` header
      even though they came from one underlying plan-line record.
    - This split applies symmetrically to the `actualAchievedTargetDescription`
      field when present — if it also narrates achievements for multiple
      objectives together, split its content the same way and route each
      part to the matching objective, rather than reproducing it as one
      undifferentiated block.

3. **Resolve the month window and fetch timesheet entries for the whole
   month, whole team.** Compute `fromDate` = first calendar day of the
   target month and `toDate` = last calendar day of the target month, then
   call `get_timesheet_data_by_daterange` with that `fromDate`/`toDate`.
   Per the Core Rule above, always explicitly pass
   `searchForLoggedInUserTimesheets: false` so entries for every employee
   are returned, not just the logged-in user.
   Each returned timesheet has a `timesheetDate`, `employeeName`, and
   `lines` array (`projectName`, `moduleName`, `taskName`, `activityName`,
   `hours`, `description`) — filter to lines whose `projectName` matches
   the resolved project.

4. **Resolve team roster (as needed for attribution).** Call
   `get_team_member_by_project_id` with the `projectId` when a timesheet
   entry's `employeeName` — or a name attributed on a plan line
   (`expectedDescriptionCreatedBy` / `requirementEnteredBy` /
   `requirementIdentifiedBy`) — is ambiguous (initials, first name only)
   and you need to confirm it belongs to the project team. Don't guess.

5. **Match** each planned objective (`expectedTargetDescription` or
   `requirementTitle`) against the month's timesheet lines using semantic
   matching of `taskName`, `moduleName`, and `description`. If a match is
   ambiguous, call `get_task_by_task_number` for that timesheet line's task
   to confirm what it corresponds to, and/or `get_team_member_by_project_id`
   to confirm the employee's assignment, before deciding — don't guess.
   - Timesheet lines that clearly correspond to a planned objective → that
     objective's **Done**, one plain bullet per matching line (no employee
     name, date, or hours prefix).
   - Planned objectives with no matching timesheet line → **Not done /
     Pending**.
   - Timesheet lines that don't correspond to any planned objective → the
     month-level **Unplanned Work Done** block, as plain bullets (no
     employee name, date, or hours prefix).

6. **Output** — resolved window and project header, then one block per
   planned objective (after the 2a split — a single monthly-plan line that
   bundled multiple objectives together must appear here as multiple
   independent `Plan:` blocks, each with its own title, `Done:`, and `Not
   done / Pending:`, never merged), then a single month-level unplanned-work
   block, in exactly this format:

```
**Date Range:** [Month Start] – [Month End]
**Project:** [Project Name]
**Monthly Plan:** [Month Year]

**Plan:** [Plan Title A]
**Done:**
- [bullet — only work backed by a matching timesheet entry, scoped to Plan A]

**Not done / Pending:**
- [bullet — planned activity from Plan A with no supporting timesheet evidence]

**Plan:** [Plan Title B]
**Done:**
- [bullet — only work backed by a matching timesheet entry, scoped to Plan B]

**Not done / Pending:**
- [bullet — planned activity from Plan B with no supporting timesheet evidence]

**Unplanned Work Done:**
- [bullet — work found in timesheets that was not part of any planned objective for the month]
```

Bullets are plain and clean — no `Employee Name:`, no date, and no `(Xh)`
hours suffix anywhere in the output, for any person, in any section.

   Note: even when Plan A and Plan B originated from the same
   `projectMonthlyPlanDatesLines` record (see step 2a), they are always
   rendered as separate `Plan:` blocks with their own scoped `Done:` /
   `Not done / Pending:` — never as one combined block. The
   `Unplanned Work Done:` block stays singular per month (not per plan) and
   only holds timesheet lines that don't belong to *any* objective.

   If a planned objective has no matching timesheet entries at all, still
   list it with an empty/absent **Done** and everything under **Not done /
   Pending**. If no timesheet entries fall outside the plan, omit the
   **Unplanned Work Done** block rather than leaving it empty.

If no planned objectives are found for the target month (from either
`get_monthly_plan` or the `get_requirements` fallback), say so directly and
stop — don't fabricate plan lines. If `get_timesheet_data_by_daterange`
returns no entries for the whole month (across the whole team), say so
directly — every planned objective falls under **Not done / Pending** and
there is no **Unplanned Work Done** block.

---

## Weekly Flow

1. **Fetch planned weekly plan** — call `get_weekly_plan` (`skipIndex`,
   `takeCount` required) with the target `weekEndDate` (Sat/Sun of that week),
   or per the **Single-Date Window Rule** above if the user gave one date.
   Read each `projectWeeklyPlanDatesLines` item (`expectedDescription`) along
   with its full `projectWeeklyPlanDatesLinesAssignedTo` list — every name in
   that list is in scope, not just the logged-in user.
2. **Fetch timesheet for the whole window, whole team** — call
   `get_timesheet_data_by_daterange` with `fromDate`/`toDate` covering that
   week (Mon–Sun, per week start/end used in the org, or the 7-day
   single-date window). Always explicitly pass
   `searchForLoggedInUserTimesheets: false` — pull entries for every
   employee, then filter/match against the assignees on each line.
3. **Match** each timesheet entry to the planned line it relates to, using
   both the work description/task/module **and** the employee name against
   that line's assignee list. If a match is ambiguous, call
   `get_task_by_task_number` for that timesheet's task, and/or
   `get_team_member_by_project_id` to confirm the employee's assignment,
   before deciding — don't guess.
4. **Output** — same clean bullet format as monthly, no employee attribution
   anywhere, including in the plan header:

```
**Date Range:** [Week Start] – [Week End]

**Plan:** [expectedDescription]
**Done:**
- [bullet]
- [bullet]

**Not done / Pending:**
- [bullet, and note that work is only partially complete if only some of
  the line's assignees logged matching work — without naming who]
```

Bullets — and the `**Plan:**` header line itself — are plain and clean: no
`Employee Name:`, no `(assignee: ...)` or similar attribution next to the
plan title, no date, and no `(Xh)` hours suffix anywhere in the output, for
any person. Employee identity is used only internally to verify/match work
against the plan line's assignee list — it must never be printed, in any
section, in any form (full name, initials, or an "assignee(s)" label).

Same rules: unmatched planned lines → "Not done / pending"; unmatched
timesheet entries from any employee → "Unplanned work done" block. If a line
has multiple assignees and only some of them have matching timesheet
entries, say so explicitly but without naming anyone (e.g. "only part of the
assigned work is reflected in timesheets" or "some assigned work has no
matching timesheet entries") rather than marking the whole line "Done" or
naming which assignee is short.

---

## Rules

- Every "Done" bullet must come from an actual timesheet entry — no
  speculation — but the bullet itself must be plain and clean: no employee
  name, no date, and no `(Xh)` hours suffix. Employee identity is only used
  internally to verify/match the work, never printed in the output.
- Never restrict fetching to `searchForLoggedInUserTimesheets: true`; always
  explicitly pass `searchForLoggedInUserTimesheets: false` and pull and
  consider the whole team's timesheet entries for the period, per the Core
  Rule above.
- When a plan line has several assignees, check all of them individually —
  don't stop once one assignee's work is found.
- Keep bullets to one line each, plain and factual.
- No tone-coaching, no summaries, no validation/confirmation phase — just the
  bullet output.
- If `get_timesheet_data_by_daterange` returns no entries for the period
  (across the whole team), say so directly and stop — don't generate
  actuals from the plan alone.
- If the monthly/weekly plan has no matching record for the requested
  period, say so directly and stop.
- For Monthly Flow specifically: never assume a month. If the user's
  request doesn't name a specific month or date, ask which month before
  calling `get_requirements` or any other tool.
- For Monthly Flow specifically: every "Done" bullet must be backed by an
  actual timesheet entry within the resolved month window — never infer
  completion from `requirementStatus` alone. State the resolved month
  window (`Month Start`–`Month End`) at the top of the output, same as the
  Single-Date Window rule does for Weekly Flow.
- If a single date is given, always state the resolved 7-day window
  (`fromDate`–`toDate`) at the top of the output before the bullets, so the
  user can confirm the correct range was used. `fromDate` must be exactly
  6 days before `toDate`, and `toDate` must equal the mentioned date —
  never state or use a window/week-end date that falls after the mentioned
  date.
- When a timesheet task name or employee doesn't clearly match a planned
  line/assignee, resolve it with `get_task_by_task_number` and/or
  `get_team_member_by_project_id` rather than guessing — precision over
  speed.

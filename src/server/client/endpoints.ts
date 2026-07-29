// @ts-nocheck
export const ERP_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
    },
    PROJECTS: {
        GET_PROJECT_WEEKLY_PLAN_DETAILS: '/projects/get-project-weekly-plan-details',
        SAVE_PROJECT_WEEKLY_PLAN_DATE_LINE: '/projects/save-project-weeklyplan-date-line',
        GET_PROJECT_BY_ID: '/projects',
        LIST: '/projects/list',
    },
    REQUIREMENT: {  
        LIST: '/requirement/list',
    },
    TASK: {
        GET_BY_TASK_NUMBER: '/project-tasks/list',
    },
    TIMESHEET: {
        LIST: '/Timesheet/list',
    },
    PROJECT_MODULES: {
        DROPDOWN_LIST: '/project-modules/dropdown/list',
    },
    // Add other ERP endpoints as needed
    PROJECT_ACTIVITIES: {
        LIST_EXPAND_COLLAPSE: '/project-activities/list-expand-collapse',
    },
    NOTES: {
        LIST: '/notes',
        CREATE: '/notes',
    },
    TEST_CASE: {
        LIST: '/test-case/list',
    },
    TEST_PLAN: {
        LIST: '/test-plan/list',
    },
};

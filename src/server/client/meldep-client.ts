// @ts-nocheck
import { HttpClient } from './http-client.js';
import { ERP_ENDPOINTS } from './endpoints.js';
import { meldepConfig } from '../config/meldep.config.js';
import { tokenManager } from '../auth/token-manager.js';
import { PLAN_TYPE_IDS } from '../config/constants.js';
import { sessionStore } from '../auth/session-store.js';

const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};

export class MeldepClient {
    constructor() {
        this.httpClient = new HttpClient(meldepConfig.baseURL);
    }

    async ensureAuthenticated() {
        const token = await tokenManager.getToken();
        if (token) {
            this.httpClient.setAuthToken(token);
            return token;
        }
        throw new Error('Authentication required or token expired.');
    }

    async getMonthlyPlanDetails(projectId, skipIndex, takeCount) {
        await this.ensureAuthenticated();
        try {
            const response = await this.httpClient.post(
                ERP_ENDPOINTS.PROJECTS.GET_PROJECT_WEEKLY_PLAN_DETAILS,
                null,
                {
                    params: {
                        projectId,
                        planTypeId: PLAN_TYPE_IDS.MONTHLY,
                        skipIndex,
                        takeCount,
                        weekEndDate: '',
                    },
                }
            );
            logger.info('Successfully fetched monthly plan details.');
            return response.data;
        } catch (error) {
            logger.error({ error }, 'Failed to fetch monthly plan details.');
            throw error;
        }
    }

    async getWeeklyPlanDetails(projectId, skipIndex, takeCount, weekEndDate) {
        await this.ensureAuthenticated();

        try {
            const response = await this.httpClient.post(
                ERP_ENDPOINTS.PROJECTS.GET_PROJECT_WEEKLY_PLAN_DETAILS,
                null,
                {
                    params: {
                        projectId,
                        planTypeId: PLAN_TYPE_IDS.WEEKLY,
                        skipIndex,
                        takeCount,
                        ...(weekEndDate && { weekEndDate }),
                    },
                }
            );

            logger.info(
                { projectId, skipIndex, takeCount, weekEndDate },
                'Successfully fetched weekly plan details.'
            );

            return response.data;
        } catch (error) {
            logger.error({ error }, 'Failed to fetch weekly plan details.');
            throw error;
        }
    }

    async saveWeeklyPlanDateLine(payload) {
        await this.ensureAuthenticated();
        try {
            const response = await this.httpClient.post(
                ERP_ENDPOINTS.PROJECTS.SAVE_PROJECT_WEEKLY_PLAN_DATE_LINE,
                payload
            );
            logger.info('Successfully saved weekly plan date line.');
            return response.data;
        } catch (error) {
            logger.error({ error }, 'Failed to save weekly plan date line.');
            throw error;
        }
    }

    async getProjectList(payload) {
        await this.ensureAuthenticated();
        try {
            const response = await this.httpClient.post(ERP_ENDPOINTS.PROJECTS.LIST, payload);
            logger.info('Successfully fetched project list by keyword.');
            return response.data;
        } catch (error) {
            logger.error({ error }, 'Failed to fetch project list by keyword.');
            throw error;
        }
    }

    async getAllRequirementsByProject(payload) {
        await this.ensureAuthenticated();
        try {
            const response = await this.httpClient.post(ERP_ENDPOINTS.REQUIREMENT.LIST, payload);
            logger.info('Successfully fetched all requirements by project.');
            return response.data;
        } catch (error) {
            logger.error({ error }, 'Failed to fetch all requirements by project.');
            throw error;
        }
    }

    async getTaskByTaskNumber(payload) {
        await this.ensureAuthenticated();
        const userId = sessionStore.getUserId();
        const finalPayload = {
            page: payload.page ?? 1,
            pageSize: payload.pageSize ?? 20,
            sortBy: payload.sortBy ?? 'createdOnUtc',
            descending: payload.descending ?? true,
            sorts: payload.sorts ?? {},
            searchText: payload.searchText ?? '',
            projectTaskNumber: payload.projectTaskNumber ?? '0',
            customerIds: payload.customerIds ?? [],
            companyContactIds: payload.companyContactIds ?? [],
            projectIds: payload.projectIds ?? [],
            projectModuleIds: payload.projectModuleIds ?? [],
            projectTaskIds: payload.projectTaskIds ?? [],
            projectLeadsIds: payload.projectLeadsIds ?? [],
            activityOwners: payload.activityOwners !== undefined
                ? payload.activityOwners
                : userId ? [userId] : [],
            statusIds: payload.statusIds ?? [],
            priorityIds: payload.priorityIds ?? [],
            taskTagsIds: payload.taskTagsIds ?? [],
            isTemplate: payload.isTemplate ?? false,
        };
        try {
            const response = await this.httpClient.post(ERP_ENDPOINTS.TASK.GET_BY_TASK_NUMBER, finalPayload);
            logger.info({ taskNumber: finalPayload.projectTaskNumber }, 'Successfully fetched task by task number.');
            return response.data;
        } catch (error) {
            logger.error({
                error: error?.response?.data || error.message,
                payload: finalPayload,
            }, 'Failed to fetch task by task number.');
            throw error;
        }
    }

    async getRequirementById(requirementId) {
        await this.ensureAuthenticated();
        try {
            console.error(`DEBUG: Calling GET /requirement/details/${requirementId}`);
            const response = await this.httpClient.get(`/requirement/details/${requirementId}`);
            logger.info('Successfully fetched requirement details by ID.');
            return response.data;
        } catch (error) {
            console.error(`DEBUG 400 error response data:`, JSON.stringify(error?.response?.data));
            console.error(`DEBUG 400 error status:`, error?.response?.status);
            logger.error({ error }, 'Failed to fetch requirement details by ID.');
            throw error;
        }
    }

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
            const response = await this.httpClient.post(ERP_ENDPOINTS.TIMESHEET.LIST, finalPayload);
            logger.info('Successfully fetched timesheet data by date range.');
            return response.data;
        } catch (error) {
            logger.error({ error }, 'Failed to fetch timesheet data by date range.');
            throw error;
        }
    }

    async getProjectModules(projectId) {
        await this.ensureAuthenticated();
        try {
            console.error(`DEBUG: Calling GET /project-module/list?projectId=${projectId}`);
            const response = await this.httpClient.get(
                `/project-module/list`,
                { params: { projectId } }
            );
            console.error(`DEBUG: project-module/list response:`, JSON.stringify(response.data));
            logger.info('Successfully fetched project modules.');
            return response.data;
        } catch (error) {
            console.error(`DEBUG: project-module/list FAILED:`, error?.response?.status, JSON.stringify(error?.response?.data));
            logger.error({ error }, 'Failed to fetch project modules.');
            throw error;
        }
    }

    async getModulesByProjectId(projectId) {
        await this.ensureAuthenticated();
        try {
            console.error(`DEBUG: Calling GET ${ERP_ENDPOINTS.PROJECT_MODULES.DROPDOWN_LIST}?ProjectId=${projectId}`);
            const response = await this.httpClient.get(
                ERP_ENDPOINTS.PROJECT_MODULES.DROPDOWN_LIST,
                {
                    params: {
                        isTemplate: false,
                        ProjectId: projectId,
                        showTaskCount: false,
                    },
                }
            );
            logger.info('Successfully fetched project modules dropdown list.');
            return response.data;
        } catch (error) {
            console.error(`DEBUG: project-modules/dropdown/list FAILED:`, error?.response?.status, JSON.stringify(error?.response?.data));
            logger.error({ error }, 'Failed to fetch project modules dropdown list.');
            throw error;
        }
    }

    //get-team-member-by-project-id
    async getTeamMembersByProjectId(projectId) {
        await this.ensureAuthenticated();

        try {
            const response = await this.httpClient.get(
                `${ERP_ENDPOINTS.PROJECTS.GET_PROJECT_BY_ID}/${projectId}`
            );

            logger.info(
                'Successfully fetched project details.'
            );

            return response.data;

        } catch (error) {

            logger.error(
                { error },
                'Failed to fetch project details.'
            );

            throw error;
        }
    }

    //get_employee_workload_report
    async getEmployeeWorkloadReport(employeeId) {
            await this.ensureAuthenticated();

            try {
                if (!employeeId || typeof employeeId !== 'string') {
                    throw new Error('Employee ID is required and must be a string');
                }

                const isInvalidFormat =
                    employeeId.length < 10 || !employeeId.includes('-');

                if (isInvalidFormat) {
                    throw new Error('Invalid employee ID format');
                }

                const activitiesResponse = await this.httpClient.post(
                    ERP_ENDPOINTS.PROJECT_ACTIVITIES.LIST_EXPAND_COLLAPSE,
                    {
                        page: 1,
                        pageSize: 100,
                        sortBy: 'project.name',
                        sorts: {},
                        descending: false,
                        searchText: '',

                        assignedToIds: [employeeId],

                        projectIds: [],
                        projectModuleIds: [],
                        activityNameIds: [],
                        statusIds: [],
                        activeStatus: null,
                        sprintWeekEndDate: null,

                        activityStatusIds: [
                            '6FD63531-D5EB-45D8-9491-6E7B98BB2194',
                            '148AFC4C-E5E0-490D-9268-680587BF5183',
                            '853B698D-2E6B-4751-B907-C65E4522D42C'
                        ]
                    }
                );

                logger.info(
                    `Successfully fetched employee activities for employeeId: ${employeeId}`
                );

                const activities = activitiesResponse?.data || [];

                if (!activities || activities.length === 0) {
                    logger.warn(
                        `No activities found for employeeId: ${employeeId}`
                    );

                    return {
                        activities: [],
                        projects: [],
                        isEmpty: true
                    };
                }

                return {
                    activities,
                    projects: [],
                    isEmpty: false
                };

            } catch (error) {
                logger.error(
                    { error },
                    `Failed to fetch employee report for employeeId: ${employeeId}`
                );

                throw new Error(
                    error?.message || 'Failed to fetch employee workload report'
                );
            }
        }

    // get_module_by_id
    async getModuleById(moduleId) {
        await this.ensureAuthenticated();

        try {
            if (!moduleId || typeof moduleId !== 'string') {
                throw new Error('Module ID is required and must be a string');
            }

            const response = await this.httpClient.post(
                ERP_ENDPOINTS.REQUIREMENT.LIST,
                {
                    page: 1,
                    pageSize: 100,
                    sortBy: 'status.dropDownValue',
                    sorts: {},
                    descending: false,
                    searchText: '',
                    requirementNumber: '0',
                    projectIds: [],
                    projectModuleIds: [moduleId],
                    requirementGroupIds: [],
                    name: '',
                    requirementType: null,
                    statusIds: [],
                    identifiedByIds: [],
                    fromDate: null,
                    toDate: null,
                    requirementTagIds: [],
                }
            );

            logger.info(
                `Successfully fetched module details for moduleId: ${moduleId}`
            );

            return response.data;

        } catch (error) {
            logger.error(
                { error },
                `Failed to fetch module details for moduleId: ${moduleId}`
            );

            throw new Error(
                error?.message || 'Failed to fetch module details'
            );
        }
    }

    // get_project_list
    async getProjectList(payload) {
        await this.ensureAuthenticated();

        try {
            const response = await this.httpClient.post(
                ERP_ENDPOINTS.PROJECTS.LIST,
                payload
            );

            logger.info('Successfully fetched project list.');

            return response.data;

        } catch (error) {
            logger.error(
                { error },
                'Failed to fetch project list.'
            );

            throw new Error(
                error?.message || 'Failed to fetch project list'
            );
        }
    }

    // add_requirement_note
    async addRequirementNote(requirementNumber, noteText) {
        await this.ensureAuthenticated();
        try {
            let uuid = requirementNumber;
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requirementNumber);

            if (!isUUID) {
                const listResult = await this.getAllRequirementsByProject({
                    page: 1,
                    pageSize: 1,
                    sortBy: 'status.dropDownValue',
                    descending: false,
                    sorts: {},
                    searchText: '',
                    requirementNumber,
                    projectIds: [],
                    projectModuleIds: [],
                    requirementGroupIds: [],
                    name: '',
                    requirementType: null,
                    statusIds: [],
                    identifiedByIds: [],
                    fromDate: null,
                    toDate: null,
                    requirementTagIds: [],
                });

                const match = listResult?.data?.[0];
                if (!match || !match.id) {
                    throw new Error(`No requirement found with number "${requirementNumber}".`);
                }

                uuid = match.id;
            }

            const response = await this.httpClient.post(
                ERP_ENDPOINTS.NOTES.CREATE,
                {
                    subModuleId: uuid,
                    type: 'Requirement',
                    note: noteText,
                }
            );

            logger.info('Successfully added requirement note.');
            return response.data;
        } catch (error) {
            logger.error({ error }, 'Failed to add requirement note.');
            throw error;
        }
    }

    async addWeeklyActuals(projectId, weekendDate, weeklyActual) {
        await this.ensureAuthenticated();
    }

    // get_test_case_by_id
    async getTestCaseById(testCaseId: string) {
        await this.ensureAuthenticated();

        try {
            if (
                !testCaseId ||
                typeof testCaseId !== 'string' ||
                testCaseId.trim() === ''
            ) {
                throw new Error(
                    'Test Case ID is required and must be a valid UUID'
                );
            }

            const normalizedTestCaseId = testCaseId.trim();
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            if (!uuidPattern.test(normalizedTestCaseId)) {
                throw new Error('Test Case ID must be a valid UUID');
            }

            const payload = {
                page: 1,
                pageSize: 100,
                sortBy: 'testCaseNumber',
                sorts: {},
                descending: true,
                searchText: '',
                testCaseNumber: 0,
                projectIds: [],
                testPlanIds: [],
                statusIds: [],
                testedByIds: [],
                fromDate: null,
                toDate: null,
            };

            const response = await this.httpClient.post(
                ERP_ENDPOINTS.TEST_CASE.LIST,
                payload
            );

            const responseData = response?.data;
            const testCases = Array.isArray(responseData)
                ? responseData
                : Array.isArray(responseData?.data)
                    ? responseData.data
                    : [];

            const normalizedIdLowerCase = normalizedTestCaseId.toLowerCase();
            const matchedTestCase = testCases.find((testCase: any) => {
                const recordId = String(testCase?.id ?? '')
                    .trim()
                    .toLowerCase();

                return recordId === normalizedIdLowerCase;
            });

            logger.info(
                matchedTestCase
                    ? `Successfully fetched test case details for ID: ${normalizedTestCaseId}`
                    : `No test case found for ID: ${normalizedTestCaseId}`
            );

            return {
                editing: responseData?.editing ?? false,
                data: matchedTestCase ? [matchedTestCase] : [],
            };
        } catch (error: any) {
            logger.error(
                {
                    error,
                    testCaseId,
                    status: error?.response?.status,
                    requestUrl: error?.config?.url,
                    requestMethod: error?.config?.method,
                    requestData: error?.config?.data,
                    responseData: error?.response?.data,
                },
                `Failed to fetch test case details for ID: ${testCaseId}`
            );

            throw new Error(
                error?.response?.data?.message ||
                error?.message ||
                'Failed to fetch test case details'
            );
        }
    }

    // get_test_plan_by_id
    async getTestPlanById(testPlanId: string) {
        await this.ensureAuthenticated();

        try {
            if (!testPlanId || typeof testPlanId !== 'string' || testPlanId.trim() === '') {
                throw new Error('Test Plan ID is required and must be a valid UUID');
            }

            const normalizedTestPlanId = testPlanId.trim();
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            if (!uuidPattern.test(normalizedTestPlanId)) {
                throw new Error('Test Plan ID must be a valid UUID');
            }

            const payload = {
                page: 1,
                pageSize: 100,
                sortBy: 'testPlanNumber',
                sorts: {},
                descending: true,
                searchText: '',
                projectIds: [],
                planMakerIds: [],
                planReviewerIds: [],
                fromDate: null,
                toDate: null,
            };

            const response = await this.httpClient.post(
                ERP_ENDPOINTS.TEST_PLAN.LIST,
                payload
            );

            const responseData = response?.data;
            const testPlans = Array.isArray(responseData)
                ? responseData
                : Array.isArray(responseData?.data)
                    ? responseData.data
                    : [];

            const normalizedIdLowerCase = normalizedTestPlanId.toLowerCase();
            const matchedTestPlan = testPlans.find((testPlan: any) => {
                const recordId = String(testPlan?.id ?? '')
                    .trim()
                    .toLowerCase();

                return recordId === normalizedIdLowerCase;
            });

            logger.info(
                matchedTestPlan
                    ? `Successfully fetched test plan details for ID: ${normalizedTestPlanId}`
                    : `No test plan found for ID: ${normalizedTestPlanId}`
            );

            return {
                editing: responseData?.editing ?? false,
                data: matchedTestPlan ? [matchedTestPlan] : [],
            };
        } catch (error: any) {
            logger.error(
                {
                    error,
                    testPlanId,
                    status: error?.response?.status,
                    requestUrl: error?.config?.url,
                    requestMethod: error?.config?.method,
                    requestData: error?.config?.data,
                    responseData: error?.response?.data,
                },
                `Failed to fetch test plan details for ID: ${testPlanId}`
            );

            throw new Error(
                error?.response?.data?.message ||
                error?.message ||
                'Failed to fetch test plan details'
            );
        }
    }

    // list_test_plans_by_project_id
    async listTestPlansByProjectId(projectId: string) {
        await this.ensureAuthenticated();

        try {
            if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
                throw new Error('Project ID is required and must be a valid UUID');
            }

            const normalizedProjectId = projectId.trim();
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            if (!uuidPattern.test(normalizedProjectId)) {
                throw new Error('Project ID must be a valid UUID');
            }

            const payload = {
                page: 1,
                pageSize: 100,
                sortBy: 'testPlanNumber',
                sorts: {},
                descending: true,
                searchText: '',
                projectIds: [normalizedProjectId],
                planMakerIds: [],
                planReviewerIds: [],
                fromDate: null,
                toDate: null,
            };

            const response = await this.httpClient.post(
                ERP_ENDPOINTS.TEST_PLAN.LIST,
                payload
            );

            const responseData = response?.data;
            const testPlans = Array.isArray(responseData)
                ? responseData
                : Array.isArray(responseData?.data)
                    ? responseData.data
                    : [];

            const normalizedProjectIdLowerCase = normalizedProjectId.toLowerCase();
            const matchingTestPlans = testPlans.filter((testPlan: any) => {
                const recordProjectId = String(
                    testPlan?.projectId || testPlan?.project?.id || ''
                )
                    .trim()
                    .toLowerCase();

                return recordProjectId === normalizedProjectIdLowerCase;
            });

            logger.info(
                `Successfully fetched ${matchingTestPlans.length} test plan(s) for projectId: ${normalizedProjectId}`
            );

            return {
                editing: responseData?.editing ?? false,
                data: matchingTestPlans,
            };
        } catch (error: any) {
            logger.error(
                {
                    error,
                    projectId,
                    status: error?.response?.status,
                    requestUrl: error?.config?.url,
                    requestMethod: error?.config?.method,
                    requestData: error?.config?.data,
                    responseData: error?.response?.data,
                },
                `Failed to fetch test plans for projectId: ${projectId}`
            );

            throw new Error(
                error?.response?.data?.message ||
                error?.message ||
                'Failed to fetch test plans'
            );
        }
    }

    // list_test_cases_by_test_plan
    async listTestCasesByTestPlan(testPlanName: string) {
        await this.ensureAuthenticated();

        try {
            if (!testPlanName || typeof testPlanName !== 'string' || testPlanName.trim() === '') {
                throw new Error('Test Plan Name is required and must be a string');
            }

            const normalizedTestPlanName = testPlanName.trim();
            const payload = {
                page: 1,
                pageSize: 100,
                sortBy: 'testCaseNumber',
                sorts: {},
                descending: true,
                searchText: normalizedTestPlanName,
                testCaseNumber: 0,
                projectIds: [],
                testPlanIds: [],
                statusIds: [],
                testedByIds: [],
                fromDate: null,
                toDate: null,
            };

            const response = await this.httpClient.post(
                ERP_ENDPOINTS.TEST_CASE.LIST,
                payload
            );

            const responseData = response?.data;
            const testCases = Array.isArray(responseData)
                ? responseData
                : Array.isArray(responseData?.data)
                    ? responseData.data
                    : [];

            const normalizedNameLowerCase = normalizedTestPlanName.toLowerCase();
            const matchingTestCases = testCases.filter((testCase: any) => {
                const recordTestPlanName = String(testCase?.testPlan?.name ?? '')
                    .trim()
                    .toLowerCase();

                return recordTestPlanName === normalizedNameLowerCase;
            });

            logger.info(
                `Successfully fetched ${matchingTestCases.length} test case(s) for Test Plan Name: ${normalizedTestPlanName}`
            );

            return {
                editing: responseData?.editing ?? false,
                data: matchingTestCases,
            };
        } catch (error: any) {
            logger.error(
                {
                    error,
                    testPlanName,
                    status: error?.response?.status,
                    requestUrl: error?.config?.url,
                    requestMethod: error?.config?.method,
                    requestData: error?.config?.data,
                    responseData: error?.response?.data,
                },
                `Failed to fetch test cases for Test Plan Name: ${testPlanName}`
            );

            throw new Error(
                error?.response?.data?.message ||
                error?.message ||
                'Failed to fetch test cases'
            );
        }
    }
}
export const meldepClient = new MeldepClient();
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
            const response = await this.httpClient.post(ERP_ENDPOINTS.PROJECTS.GET_PROJECT_WEEKLY_PLAN_DETAILS, null, // POST body can be null for this endpoint
            {
                params: {
                    projectId,
                    planTypeId: PLAN_TYPE_IDS.MONTHLY,
                    skipIndex,
                    takeCount,
                    weekEndDate: '', // As per document, weekEndDate is empty for monthly plan
                },
            });
            logger.info('Successfully fetched monthly plan details.');
            return response.data;
        }
        catch (error) {
            logger.error({ error }, 'Failed to fetch monthly plan details.');
            throw error;
        }
    }
    async getWeeklyPlanDetails(projectId, skipIndex, takeCount, weekEndDate) {
        await this.ensureAuthenticated();
        try {
            const response = await this.httpClient.post(ERP_ENDPOINTS.PROJECTS.GET_PROJECT_WEEKLY_PLAN_DETAILS, null, // POST body can be null for this endpoint
            {
                params: {
                    projectId,
                    planTypeId: PLAN_TYPE_IDS.WEEKLY,
                    skipIndex,
                    takeCount,
                    ...(weekEndDate && { weekEndDate }),
                },
            });
            logger.info('Successfully fetched weekly plan details.');
            return response.data;
        }
        catch (error) {
            logger.error({ error }, 'Failed to fetch weekly plan details.');
            throw error;
        }
    }
    async getAllRequirementsByProject(payload) {
        await this.ensureAuthenticated();
        try {
            const response = await this.httpClient.post(ERP_ENDPOINTS.REQUIREMENT.LIST, payload);
            logger.info('Successfully fetched all requirements by project.');
            return response.data;
        }
        catch (error) {
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
                : userId
                    ? [userId]
                    : [],
            statusIds: payload.statusIds ?? [],
            priorityIds: payload.priorityIds ?? [],
            taskTagsIds: payload.taskTagsIds ?? [],
            isTemplate: payload.isTemplate ?? false,
        };
        try {
            const response = await this.httpClient.post(ERP_ENDPOINTS.TASK.GET_BY_TASK_NUMBER, finalPayload);
            logger.info({
                taskNumber: finalPayload.projectTaskNumber,
            }, 'Successfully fetched task by task number.');
            return response.data;
        }
        catch (error) {
            logger.error({
                error: error?.response?.data ||
                    error.message,
                payload: finalPayload,
            }, 'Failed to fetch task by task number.');
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
}
export const meldepClient = new MeldepClient();

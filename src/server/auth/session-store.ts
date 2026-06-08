// @ts-nocheck
class SessionStore {
    constructor() {
        this.data = {};
    }
    set(key, value) {
        this.data[key] = value;
    }
    get(key) {
        return this.data[key];
    }
    getProjectId() {
        return this.get('projectId');
    }
    getUserId() {
        return this.get('userId');
    }
    getEmployeeId() {
        return this.get('employeeId');
    }
    getAccessToken() {
        return this.get('accessToken');
    }
    clear() {
        this.data = {};
    }
    getSiteId() { 
        return this.get('siteId'); 
    }
    getSiteName() { 
        return this.get('siteName'); 
    }
    getSiteLandingPage() { 
        return this.get('siteLandingPage'); 
    }
    getSiteTimezone() { 
        return this.get('siteTimezone'); 
    }
}
export const sessionStore = new SessionStore();

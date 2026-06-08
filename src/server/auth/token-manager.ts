// @ts-nocheck
import { AUTH_EXPIRATION_BUFFER_SECONDS } from '../config/constants.js';
const logger = {
    info: (...args) => console.error(...args),
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.error(...args),
};
class TokenManager {
    constructor() {
        this.authToken = null;
    }
    static getInstance() {
        if (!TokenManager.instance) {
            TokenManager.instance = new TokenManager();
        }
        return TokenManager.instance;
    }
    /**
     * Store auth token and expiry
     */
    setToken(token, expiresIn) {
        const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
        this.authToken = {
            token,
            expiresAt,
        };
        logger.info('Authentication successful.');
    }
    /**
     * Get valid token
     * Refresh automatically if expired/near expiry
     */
    async getToken() {
        if (!this.authToken) {
            logger.warn('No auth token found.');
            return null;
        }
        if (this.isTokenExpired()) {
            logger.warn('Auth token expired or near expiration. Attempting refresh...');
            try {
                await this.refreshToken();
            }
            catch (error) {
                logger.error({ error }, 'Token refresh failed.');
                this.clearToken();
                return null;
            }
        }
        return this.authToken?.token || null;
    }
    /**
     * Check whether token is expired
     * or close to expiry
     */
    isTokenExpired() {
        if (!this.authToken) {
            return true;
        }
        const now = Math.floor(Date.now() / 1000);
        return (this.authToken.expiresAt - now <
            AUTH_EXPIRATION_BUFFER_SECONDS);
    }
    /**
     * Clear auth token
     */
    clearToken() {
        this.authToken = null;
        logger.info('Auth token cleared.');
    }
    /**
     * Refresh token logic
     *
     * Replace this implementation
     * with actual refresh API or re-login.
     */
    async refreshToken() {
        logger.info('Refreshing auth token...');
        /**
         * TODO:
         * Replace with actual API refresh call
         */
        throw new Error('Refresh token implementation not added.');
    }
    /**
     * Optional helper
     */
    hasToken() {
        return !!this.authToken;
    }
}
export const tokenManager = TokenManager.getInstance();

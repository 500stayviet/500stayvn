"use strict";
/**
 * HTTP client utility for making API requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
class HttpClient {
    /**
     * Make HTTP request
     */
    static async request(url, options = {}) {
        const { method = 'GET', headers = {}, body, timeout = 30000, } = options;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                method,
                headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }
    /**
     * GET request
     */
    static async get(url, headers) {
        return this.request(url, { method: 'GET', headers });
    }
    /**
     * POST request
     */
    static async post(url, body, headers) {
        return this.request(url, { method: 'POST', body, headers });
    }
}
exports.HttpClient = HttpClient;
//# sourceMappingURL=httpClient.js.map
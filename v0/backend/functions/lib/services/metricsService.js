"use strict";
/**
 * Metrics service for tracking application metrics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsService = exports.MetricsService = void 0;
class MetricsService {
    constructor() {
        this.metrics = [];
    }
    /**
     * Record a metric
     */
    record(name, value, tags) {
        this.metrics.push({
            name,
            value,
            timestamp: Date.now(),
            tags,
        });
    }
    /**
     * Increment a counter
     */
    increment(name, value = 1, tags) {
        this.record(name, value, tags);
    }
    /**
     * Record timing metric
     */
    timing(name, duration, tags) {
        this.record(name, duration, tags);
    }
    /**
     * Get all metrics
     */
    getMetrics() {
        return [...this.metrics];
    }
    /**
     * Clear all metrics
     */
    clear() {
        this.metrics = [];
    }
    /**
     * Get metrics by name
     */
    getMetricsByName(name) {
        return this.metrics.filter(m => m.name === name);
    }
}
exports.MetricsService = MetricsService;
exports.metricsService = new MetricsService();
//# sourceMappingURL=metricsService.js.map
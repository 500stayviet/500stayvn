/**
 * Metrics service for tracking application metrics
 */

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export class MetricsService {
  private metrics: Metric[] = [];

  /**
   * Record a metric
   */
  record(name: string, value: number, tags?: Record<string, string>): void {
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
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.record(name, value, tags);
  }

  /**
   * Record timing metric
   */
  timing(name: string, duration: number, tags?: Record<string, string>): void {
    this.record(name, duration, tags);
  }

  /**
   * Get all metrics
   */
  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): Metric[] {
    return this.metrics.filter(m => m.name === name);
  }
}

export const metricsService = new MetricsService();

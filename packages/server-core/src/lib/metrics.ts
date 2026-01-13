/**
 * DEVOPS-004: Prometheus metrics collector
 * Lightweight metrics collection for application monitoring
 *
 * Exposes metrics in Prometheus text format at /metrics endpoint
 */

/**
 * Counter metric for tracking cumulative values
 */
interface Counter {
	name: string;
	help: string;
	labels: Record<string, number>;
}

/**
 * Histogram metric for tracking distributions
 */
interface Histogram {
	name: string;
	help: string;
	buckets: number[];
	observations: Map<string, number[]>;
	sum: Map<string, number>;
	count: Map<string, number>;
}

/**
 * Gauge metric for tracking current values
 */
interface Gauge {
	name: string;
	help: string;
	values: Map<string, number>;
}

/**
 * Simple metrics collector (no external dependencies)
 */
class MetricsCollector {
	private counters = new Map<string, Counter>();
	private histograms = new Map<string, Histogram>();
	private gauges = new Map<string, Gauge>();
	private startTime = Date.now();

	/**
	 * Register a counter metric
	 */
	registerCounter(name: string, help: string): void {
		if (!this.counters.has(name)) {
			this.counters.set(name, { name, help, labels: {} });
		}
	}

	/**
	 * Increment a counter
	 */
	incrementCounter(name: string, labels: Record<string, string> = {}): void {
		const counter = this.counters.get(name);
		if (!counter) {
			this.registerCounter(name, `Auto-registered counter ${name}`);
		}
		const labelKey = this.labelsToKey(labels);
		const c = this.counters.get(name);
		if (c) {
			c.labels[labelKey] = (c.labels[labelKey] || 0) + 1;
		}
	}

	/**
	 * Register a histogram metric
	 */
	registerHistogram(
		name: string,
		help: string,
		buckets: number[] = [
			0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
		],
	): void {
		if (!this.histograms.has(name)) {
			this.histograms.set(name, {
				name,
				help,
				buckets: buckets.sort((a, b) => a - b),
				observations: new Map(),
				sum: new Map(),
				count: new Map(),
			});
		}
	}

	/**
	 * Observe a value for a histogram
	 */
	observeHistogram(
		name: string,
		value: number,
		labels: Record<string, string> = {},
	): void {
		const histogram = this.histograms.get(name);
		if (!histogram) {
			this.registerHistogram(name, `Auto-registered histogram ${name}`);
		}
		const h = this.histograms.get(name);
		if (h) {
			const labelKey = this.labelsToKey(labels);
			if (!h.observations.has(labelKey)) {
				h.observations.set(labelKey, []);
				h.sum.set(labelKey, 0);
				h.count.set(labelKey, 0);
			}
			h.observations.get(labelKey)?.push(value);
			h.sum.set(labelKey, (h.sum.get(labelKey) || 0) + value);
			h.count.set(labelKey, (h.count.get(labelKey) || 0) + 1);
		}
	}

	/**
	 * Register a gauge metric
	 */
	registerGauge(name: string, help: string): void {
		if (!this.gauges.has(name)) {
			this.gauges.set(name, { name, help, values: new Map() });
		}
	}

	/**
	 * Set a gauge value
	 */
	setGauge(
		name: string,
		value: number,
		labels: Record<string, string> = {},
	): void {
		const gauge = this.gauges.get(name);
		if (!gauge) {
			this.registerGauge(name, `Auto-registered gauge ${name}`);
		}
		const g = this.gauges.get(name);
		if (g) {
			const labelKey = this.labelsToKey(labels);
			g.values.set(labelKey, value);
		}
	}

	/**
	 * Increment a gauge
	 */
	incrementGauge(
		name: string,
		value = 1,
		labels: Record<string, string> = {},
	): void {
		const gauge = this.gauges.get(name);
		if (!gauge) {
			this.registerGauge(name, `Auto-registered gauge ${name}`);
		}
		const g = this.gauges.get(name);
		if (g) {
			const labelKey = this.labelsToKey(labels);
			g.values.set(labelKey, (g.values.get(labelKey) || 0) + value);
		}
	}

	/**
	 * Convert labels object to a string key
	 */
	private labelsToKey(labels: Record<string, string>): string {
		if (Object.keys(labels).length === 0) return "";
		return Object.entries(labels)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, v]) => `${k}="${v}"`)
			.join(",");
	}

	/**
	 * Format labels for Prometheus output
	 */
	private formatLabels(labelKey: string): string {
		return labelKey ? `{${labelKey}}` : "";
	}

	/**
	 * Generate Prometheus text format output
	 */
	getMetrics(): string {
		const lines: string[] = [];
		const uptimeSeconds = (Date.now() - this.startTime) / 1000;

		// Add process metrics
		lines.push("# HELP process_uptime_seconds Process uptime in seconds");
		lines.push("# TYPE process_uptime_seconds gauge");
		lines.push(`process_uptime_seconds ${uptimeSeconds}`);
		lines.push("");

		// Memory metrics (Bun-compatible)
		const memUsage = process.memoryUsage();
		lines.push(
			"# HELP process_resident_memory_bytes Resident memory size in bytes",
		);
		lines.push("# TYPE process_resident_memory_bytes gauge");
		lines.push(`process_resident_memory_bytes ${memUsage.rss}`);
		lines.push("");

		lines.push("# HELP process_heap_bytes Heap memory usage in bytes");
		lines.push("# TYPE process_heap_bytes gauge");
		lines.push(`process_heap_bytes ${memUsage.heapUsed}`);
		lines.push("");

		// Counters
		for (const counter of this.counters.values()) {
			lines.push(`# HELP ${counter.name} ${counter.help}`);
			lines.push(`# TYPE ${counter.name} counter`);
			for (const [labelKey, value] of Object.entries(counter.labels)) {
				lines.push(`${counter.name}${this.formatLabels(labelKey)} ${value}`);
			}
			lines.push("");
		}

		// Gauges
		for (const gauge of this.gauges.values()) {
			lines.push(`# HELP ${gauge.name} ${gauge.help}`);
			lines.push(`# TYPE ${gauge.name} gauge`);
			for (const [labelKey, value] of gauge.values.entries()) {
				lines.push(`${gauge.name}${this.formatLabels(labelKey)} ${value}`);
			}
			lines.push("");
		}

		// Histograms
		for (const histogram of this.histograms.values()) {
			lines.push(`# HELP ${histogram.name} ${histogram.help}`);
			lines.push(`# TYPE ${histogram.name} histogram`);

			for (const [labelKey, observations] of histogram.observations.entries()) {
				const labelPrefix = labelKey ? `${labelKey},` : "";

				// Calculate bucket counts
				let cumulativeCount = 0;
				for (const bucket of histogram.buckets) {
					const countInBucket = observations.filter((v) => v <= bucket).length;
					cumulativeCount = countInBucket;
					lines.push(
						`${histogram.name}_bucket{${labelPrefix}le="${bucket}"} ${cumulativeCount}`,
					);
				}
				lines.push(
					`${histogram.name}_bucket{${labelPrefix}le="+Inf"} ${observations.length}`,
				);
				lines.push(
					`${histogram.name}_sum${this.formatLabels(labelKey)} ${histogram.sum.get(labelKey) || 0}`,
				);
				lines.push(
					`${histogram.name}_count${this.formatLabels(labelKey)} ${histogram.count.get(labelKey) || 0}`,
				);
			}
			lines.push("");
		}

		return lines.join("\n");
	}

	/**
	 * Reset all metrics (useful for testing)
	 */
	reset(): void {
		this.counters.clear();
		this.histograms.clear();
		this.gauges.clear();
	}
}

// Global metrics collector instance
export const metrics = new MetricsCollector();

// Pre-register common metrics
metrics.registerCounter("http_requests_total", "Total number of HTTP requests");
metrics.registerCounter("http_errors_total", "Total number of HTTP errors");
metrics.registerHistogram(
	"http_request_duration_seconds",
	"HTTP request duration in seconds",
);
metrics.registerGauge(
	"http_requests_in_flight",
	"Number of HTTP requests currently being processed",
);
metrics.registerCounter("db_queries_total", "Total number of database queries");
metrics.registerCounter("db_errors_total", "Total number of database errors");
metrics.registerHistogram(
	"db_query_duration_seconds",
	"Database query duration in seconds",
);

/**
 * Timer utility for measuring durations
 */
export function startTimer(): () => number {
	const start = performance.now();
	return () => (performance.now() - start) / 1000; // Return seconds
}

/**
 * Middleware to record HTTP metrics
 */
export function recordHttpRequest(
	method: string,
	path: string,
	statusCode: number,
	durationSeconds: number,
): void {
	// Normalize path to avoid high cardinality
	const normalizedPath = normalizePath(path);

	metrics.incrementCounter("http_requests_total", {
		method,
		path: normalizedPath,
		status: String(statusCode),
	});

	if (statusCode >= 400) {
		metrics.incrementCounter("http_errors_total", {
			method,
			path: normalizedPath,
			status: String(statusCode),
		});
	}

	metrics.observeHistogram("http_request_duration_seconds", durationSeconds, {
		method,
		path: normalizedPath,
	});
}

/**
 * Record database query metrics
 */
export function recordDbQuery(
	operation: string,
	durationSeconds: number,
	error = false,
): void {
	metrics.incrementCounter("db_queries_total", { operation });

	if (error) {
		metrics.incrementCounter("db_errors_total", { operation });
	}

	metrics.observeHistogram("db_query_duration_seconds", durationSeconds, {
		operation,
	});
}

/**
 * Normalize path to reduce cardinality
 * Replaces dynamic segments with placeholders
 */
function normalizePath(path: string): string {
	return (
		path
			// Replace UUIDs
			.replace(
				/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
				":id",
			)
			// Replace numeric IDs
			.replace(/\/\d+(?=\/|$)/g, "/:id")
			// Replace base64-ish tokens
			.replace(/\/[A-Za-z0-9_-]{20,}(?=\/|$)/g, "/:token")
			// Truncate long paths
			.slice(0, 100)
	);
}

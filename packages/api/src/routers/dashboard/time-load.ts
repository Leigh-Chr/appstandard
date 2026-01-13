/**
 * Dashboard Time Load and Heatmap
 * Handles time utilization metrics and heatmap generation
 */

import prisma from "@appstandard/db";
import { addWeeks } from "date-fns";
import {
	calculatePercentage,
	type DashboardContext,
	getAvailableHours,
	getEventDurationHours,
	getHourSlot,
	roundToOneDecimal,
} from "./helpers";

/**
 * Heatmap data point
 */
export interface HeatmapEntry {
	dayOfWeek: number;
	hourSlot: string;
	hours: number;
}

/**
 * Time load result
 */
export interface TimeLoadResult {
	hoursOccupied: number;
	hoursAvailable: number;
	percentageOccupied: number;
	heatmap: HeatmapEntry[];
}

/**
 * Calculate time load and generate heatmap
 */
export async function getTimeLoad(
	ctx: DashboardContext,
	hoursOccupied: number,
): Promise<TimeLoadResult> {
	const { calendarIds, now, period } = ctx;
	const hoursAvailable = getAvailableHours(period);
	const percentageOccupied = calculatePercentage(hoursOccupied, hoursAvailable);

	// Heatmap: aggregate last 4 weeks
	const heatmapStart = addWeeks(now, -4);
	const heatmapEvents = await prisma.event.findMany({
		where: {
			calendarId: { in: calendarIds },
			startDate: { gte: heatmapStart, lte: now },
			OR: [{ transp: null }, { transp: "OPAQUE" }],
		},
		select: { startDate: true, endDate: true },
	});

	const heatmapData = new Map<string, number>();
	for (const event of heatmapEvents) {
		const dayOfWeek = event.startDate.getDay(); // 0 = Sunday
		const hour = event.startDate.getHours();
		const hourSlot = getHourSlot(hour);
		const key = `${dayOfWeek}-${hourSlot}`;
		const duration = getEventDurationHours(event.startDate, event.endDate);
		heatmapData.set(key, (heatmapData.get(key) || 0) + duration);
	}

	const heatmap = Array.from(heatmapData.entries()).map(([key, hours]) => {
		const [dayOfWeek, hourSlot] = key.split("-");
		return {
			dayOfWeek: Number.parseInt(dayOfWeek || "0", 10),
			hourSlot: hourSlot || "08-10",
			hours,
		};
	});

	return {
		hoursOccupied: roundToOneDecimal(hoursOccupied),
		hoursAvailable,
		percentageOccupied,
		heatmap,
	};
}

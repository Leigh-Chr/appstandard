import { type AlarmTrigger, parseAlarmTrigger } from "@appstandard/ics-utils";
import { useEffect, useState } from "react";
import type { AlarmFormData } from "@/lib/event-form-types";

/**
 * Hook to manage alarm triggers UI state
 * Synchronizes trigger state with alarm data and provides update function
 */
export function useAlarmTriggers(alarms: AlarmFormData[] | undefined) {
	const [alarmTriggers, setAlarmTriggers] = useState<Map<number, AlarmTrigger>>(
		new Map(),
	);

	// Initialize alarm triggers from alarms
	useEffect(() => {
		const triggers = new Map<number, AlarmTrigger>();
		alarms?.forEach((alarm, index) => {
			const parsed = parseAlarmTrigger(alarm.trigger);
			if (parsed) {
				triggers.set(index, parsed);
			} else {
				// Default trigger if parsing fails
				triggers.set(index, { when: "before", value: 15, unit: "minutes" });
			}
		});
		setAlarmTriggers(triggers);
	}, [alarms]);

	return alarmTriggers;
}

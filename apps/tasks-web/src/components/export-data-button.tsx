/**
 * Export Data Button for Tasks app
 * Wrapper around shared ExportDataButton component
 */

import { ExportDataButton as BaseExportDataButton } from "@appstandard/ui";
import { trpcClient } from "@/utils/trpc";

export function ExportDataButton() {
	return (
		<BaseExportDataButton
			exportFn={() => trpcClient.user.exportData.query()}
			filenamePrefix="appstandard-tasks-export"
		/>
	);
}

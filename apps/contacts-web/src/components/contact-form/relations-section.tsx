/**
 * Relations section for contact form
 * Supports multiple related contacts with relationship type
 * Based on RFC 6350 RELATED property (Section 6.6.6)
 */

import {
	Button,
	Card,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@appstandard/ui";
import type { ContactRelationData } from "@appstandard-contacts/core";
import { RELATION_TYPE_VALUES } from "@appstandard-contacts/core";
import { Plus, Users, X } from "lucide-react";

interface RelationsSectionProps {
	relations: ContactRelationData[];
	onChange: (relations: ContactRelationData[]) => void;
	isSubmitting: boolean;
}

const RELATION_TYPE_LABELS: Record<string, string> = {
	// Family
	parent: "Parent",
	child: "Child",
	sibling: "Sibling",
	spouse: "Spouse",
	kin: "Family/Kin",
	// Work
	"co-worker": "Co-worker",
	colleague: "Colleague",
	agent: "Agent/Representative",
	// Social
	friend: "Friend",
	acquaintance: "Acquaintance",
	contact: "Contact",
	met: "Met",
	neighbor: "Neighbor",
	"co-resident": "Co-resident",
	// Romantic
	crush: "Crush",
	date: "Date",
	sweetheart: "Sweetheart",
	muse: "Muse",
	// Other
	me: "Me (alternate identity)",
	emergency: "Emergency Contact",
};

// Group relation types for better UX
const RELATION_TYPE_GROUPS = [
	{
		label: "Family",
		types: ["parent", "child", "sibling", "spouse", "kin"],
	},
	{
		label: "Work",
		types: ["co-worker", "colleague", "agent"],
	},
	{
		label: "Social",
		types: [
			"friend",
			"acquaintance",
			"contact",
			"met",
			"neighbor",
			"co-resident",
		],
	},
	{
		label: "Romantic",
		types: ["crush", "date", "sweetheart", "muse"],
	},
	{
		label: "Other",
		types: ["me", "emergency"],
	},
];

export function RelationsSection({
	relations,
	onChange,
	isSubmitting,
}: RelationsSectionProps) {
	const handleAddRelation = () => {
		onChange([...relations, { relatedName: "", relationType: "friend" }]);
	};

	const handleRemoveRelation = (index: number) => {
		onChange(relations.filter((_, i) => i !== index));
	};

	const handleNameChange = (index: number, value: string) => {
		const newRelations = [...relations];
		const current = newRelations[index];
		if (current) {
			newRelations[index] = { ...current, relatedName: value };
			onChange(newRelations);
		}
	};

	const handleTypeChange = (index: number, type: string) => {
		const newRelations = [...relations];
		const current = newRelations[index];
		if (current) {
			newRelations[index] = { ...current, relationType: type };
			onChange(newRelations);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="flex items-center gap-2 font-medium text-sm">
					<Users className="h-4 w-4 text-muted-foreground" />
					Related People ({relations.length})
				</h4>
			</div>

			{relations.length === 0 && (
				<div className="flex items-start gap-3 rounded-md border border-muted bg-muted/50 p-4">
					<Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
					<p className="text-muted-foreground text-sm">
						No related people yet. Click "Add relation" below to link this
						contact with others.
					</p>
				</div>
			)}

			{relations.map((relation, index) => (
				<Card key={`relation-${index}`} className="border-muted p-4">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="flex items-center gap-2 font-medium text-sm">
								<Users className="h-4 w-4 text-muted-foreground" />
								Relation {index + 1}
							</h4>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => handleRemoveRelation(index)}
								disabled={isSubmitting}
								aria-label={`Remove relation ${index + 1}`}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor={`relation-name-${index}`}>Name</Label>
								<Input
									id={`relation-name-${index}`}
									type="text"
									value={relation.relatedName}
									onChange={(e) => handleNameChange(index, e.target.value)}
									disabled={isSubmitting}
									placeholder="Name of related person"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor={`relation-type-${index}`}>Relationship</Label>
								<Select
									value={relation.relationType || "friend"}
									onValueChange={(value) => handleTypeChange(index, value)}
									disabled={isSubmitting}
								>
									<SelectTrigger id={`relation-type-${index}`}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{RELATION_TYPE_GROUPS.map((group) => (
											<div key={group.label}>
												<div className="px-2 py-1.5 font-semibold text-muted-foreground text-xs">
													{group.label}
												</div>
												{group.types
													.filter((type) =>
														RELATION_TYPE_VALUES.includes(
															type as (typeof RELATION_TYPE_VALUES)[number],
														),
													)
													.map((type) => (
														<SelectItem key={type} value={type}>
															{RELATION_TYPE_LABELS[type] || type}
														</SelectItem>
													))}
											</div>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				</Card>
			))}

			<Button
				type="button"
				variant="outline"
				onClick={handleAddRelation}
				disabled={isSubmitting}
			>
				<Plus className="h-4 w-4" />
				Add relation
			</Button>
		</div>
	);
}

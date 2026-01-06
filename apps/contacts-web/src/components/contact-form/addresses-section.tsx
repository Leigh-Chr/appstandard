/**
 * Addresses section for contact form
 * Supports multiple addresses with full address components
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
	Switch,
} from "@appstandard/ui";
import type { ContactAddressData } from "@appstandard-contacts/core";
import { ADDRESS_TYPE_VALUES } from "@appstandard-contacts/core";
import { MapPin, Plus, X } from "lucide-react";

interface AddressesSectionProps {
	addresses: ContactAddressData[];
	onChange: (addresses: ContactAddressData[]) => void;
	isSubmitting: boolean;
}

const ADDRESS_TYPE_LABELS: Record<string, string> = {
	home: "Home",
	work: "Work",
};

export function AddressesSection({
	addresses,
	onChange,
	isSubmitting,
}: AddressesSectionProps) {
	const handleAddAddress = () => {
		onChange([
			...addresses,
			{
				type: "home",
				streetAddress: "",
				locality: "",
				region: "",
				postalCode: "",
				country: "",
				isPrimary: addresses.length === 0,
			},
		]);
	};

	const handleRemoveAddress = (index: number) => {
		const newAddresses = addresses.filter((_, i) => i !== index);
		// If we removed the primary, make the first one primary
		if (addresses[index]?.isPrimary && newAddresses.length > 0) {
			newAddresses[0] = { ...newAddresses[0], isPrimary: true };
		}
		onChange(newAddresses);
	};

	const handleAddressFieldChange = (
		index: number,
		field: keyof ContactAddressData,
		value: string,
	) => {
		const newAddresses = [...addresses];
		newAddresses[index] = { ...newAddresses[index], [field]: value || null };
		onChange(newAddresses);
	};

	const handleTypeChange = (index: number, type: string) => {
		const newAddresses = [...addresses];
		newAddresses[index] = {
			...newAddresses[index],
			type: type as ContactAddressData["type"],
		};
		onChange(newAddresses);
	};

	const handlePrimaryChange = (index: number, isPrimary: boolean) => {
		const newAddresses = addresses.map((address, i) => ({
			...address,
			isPrimary: i === index ? isPrimary : false,
		}));
		onChange(newAddresses);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="flex items-center gap-2 font-medium text-sm">
					<MapPin className="h-4 w-4 text-muted-foreground" />
					Addresses ({addresses.length})
				</h4>
			</div>

			{addresses.length === 0 && (
				<div className="flex items-start gap-3 rounded-md border border-muted bg-muted/50 p-4">
					<MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
					<p className="text-muted-foreground text-sm">
						No addresses yet. Click "Add address" below to add one.
					</p>
				</div>
			)}

			{addresses.map((address, index) => (
				<Card key={`address-${index}`} className="border-muted p-4">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="flex items-center gap-2 font-medium text-sm">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								Address {index + 1}
								{address.isPrimary && (
									<span className="rounded bg-primary/10 px-2 py-0.5 text-primary text-xs">
										Primary
									</span>
								)}
							</h4>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => handleRemoveAddress(index)}
								disabled={isSubmitting}
								aria-label={`Remove address ${index + 1}`}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						<div className="space-y-2">
							<Label htmlFor={`address-type-${index}`}>Type</Label>
							<Select
								value={address.type || "home"}
								onValueChange={(value) => handleTypeChange(index, value)}
								disabled={isSubmitting}
							>
								<SelectTrigger
									id={`address-type-${index}`}
									className="w-full sm:w-48"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{ADDRESS_TYPE_VALUES.map((type) => (
										<SelectItem key={type} value={type}>
											{ADDRESS_TYPE_LABELS[type] || type}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor={`address-street-${index}`}>Street Address</Label>
							<Input
								id={`address-street-${index}`}
								value={address.streetAddress || ""}
								onChange={(e) =>
									handleAddressFieldChange(
										index,
										"streetAddress",
										e.target.value,
									)
								}
								disabled={isSubmitting}
								placeholder="123 Main Street"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor={`address-extended-${index}`}>
								Apartment, Suite, etc.
							</Label>
							<Input
								id={`address-extended-${index}`}
								value={address.extendedAddress || ""}
								onChange={(e) =>
									handleAddressFieldChange(
										index,
										"extendedAddress",
										e.target.value,
									)
								}
								disabled={isSubmitting}
								placeholder="Apt 4B, Suite 200"
							/>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor={`address-city-${index}`}>City</Label>
								<Input
									id={`address-city-${index}`}
									value={address.locality || ""}
									onChange={(e) =>
										handleAddressFieldChange(index, "locality", e.target.value)
									}
									disabled={isSubmitting}
									placeholder="New York"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`address-region-${index}`}>
									State / Province
								</Label>
								<Input
									id={`address-region-${index}`}
									value={address.region || ""}
									onChange={(e) =>
										handleAddressFieldChange(index, "region", e.target.value)
									}
									disabled={isSubmitting}
									placeholder="NY"
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor={`address-postal-${index}`}>Postal Code</Label>
								<Input
									id={`address-postal-${index}`}
									value={address.postalCode || ""}
									onChange={(e) =>
										handleAddressFieldChange(
											index,
											"postalCode",
											e.target.value,
										)
									}
									disabled={isSubmitting}
									placeholder="10001"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`address-country-${index}`}>Country</Label>
								<Input
									id={`address-country-${index}`}
									value={address.country || ""}
									onChange={(e) =>
										handleAddressFieldChange(index, "country", e.target.value)
									}
									disabled={isSubmitting}
									placeholder="United States"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor={`address-pobox-${index}`}>PO Box</Label>
							<Input
								id={`address-pobox-${index}`}
								value={address.poBox || ""}
								onChange={(e) =>
									handleAddressFieldChange(index, "poBox", e.target.value)
								}
								disabled={isSubmitting}
								placeholder="PO Box 123"
							/>
						</div>

						{addresses.length > 1 && (
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label
										htmlFor={`address-primary-${index}`}
										className="cursor-pointer font-normal text-sm"
									>
										Set as primary address
									</Label>
									<p className="text-muted-foreground text-xs">
										This address will be displayed on contact cards.
									</p>
								</div>
								<Switch
									id={`address-primary-${index}`}
									checked={address.isPrimary || false}
									onCheckedChange={(checked) =>
										handlePrimaryChange(index, checked)
									}
									disabled={isSubmitting}
								/>
							</div>
						)}
					</div>
				</Card>
			))}

			<Button
				type="button"
				variant="outline"
				onClick={handleAddAddress}
				disabled={isSubmitting}
			>
				<Plus className="h-4 w-4" />
				Add address
			</Button>
		</div>
	);
}

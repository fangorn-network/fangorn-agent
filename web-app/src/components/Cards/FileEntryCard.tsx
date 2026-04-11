import { FileEntry } from "@fangorn-network/client-types";
import { CardChatConfig } from "../Chat/Chat";
import { EncryptedBadge, Pill } from "../primitives";
import { BaseCard, ExpandChevron } from "./BaseCard";

interface FileEntryRowProps {
	file: FileEntry;
	fileIndex: number;
	isSelected: boolean;
	onSelect: () => void;
}

const FILE_COLOR = "#34d399";

export const FileEntryRow = ({ file, fileIndex, isSelected, onSelect }: FileEntryRowProps) => {
	const allFields = file.fileFields ?? [];
	const plainFields = allFields.filter((f) => f.acc === "plain");
	const encFields = allFields.filter((f) => f.acc != null && f.acc !== "plain");
	const summaryField = plainFields[0];
	const secondaryField = plainFields.length > 1 ? plainFields[1] : undefined;
	const totalEncPrice = encFields.reduce(
		(sum, f) => sum + (f.pricing != null ? Number(f.pricing.price) : 0),
		0
	);

	const chat: CardChatConfig = {
		contextType: "file",
		contextLabel: `Re: File ${file.tag ?? file.id}`,
		placeholder: "Ask about this file...",
		buildContext: () => ({
			id: file.id,
			type:"file",
			tag: file.tag,
			manifestStateId: file.manifestStateId,
			schemaId: file.schemaId,
			schemaName: file.schemaName,
			fieldCount: allFields.length,
			fields: allFields.map((f) => ({
				name: f.name,
				value:f.value,
				type: f.atType,
				owner: f.pricing? f.pricing.owner : ""
			})),
		}),
	};

	return (
		<BaseCard
			isActive={isSelected}
			accentColor={FILE_COLOR}
			onClick={onSelect}
			onChatSent={() => onSelect()}
			chat={isSelected ? chat : undefined}
			borderRadius={10}
			padding="8px 10px"
			activeBg="rgba(255, 255, 255, 0.06)"
			inactiveBg="var(--color-background-secondary, #0e0e0e)"
		>
			{/* ── Summary row ── */}
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
				<div style={{ maxWidth: "60%" }}>
					<div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary, #fafafa)" }}>
						{summaryField?.value ?? file.tag ?? `File ${fileIndex + 1}`}
					</div>
					{secondaryField && (
						<div style={{ fontSize: 11, color: "var(--color-text-secondary, #8a8a8a)", marginTop: 1 }}>
							{secondaryField.name ?? "—"}: {secondaryField.value ?? "—"}
						</div>
					)}
				</div>
				<div style={{ display: "flex", gap: 4, alignItems: "center" }}>
					{encFields.length > 0 && totalEncPrice > 0 && (
						<Pill variant="green">${totalEncPrice.toFixed(2)}</Pill>
					)}
					{encFields.length > 0 && <Pill variant="amber">🔒 {encFields.length}</Pill>}
					<ExpandChevron isExpanded={isSelected} size={10} />
				</div>
			</div>

			{/* ── Expanded field list ── */}
			{isSelected && (
				<div
					style={{
						marginTop: 8,
						borderTop: "0.5px solid var(--color-border-tertiary, #1e1e1e)",
						paddingTop: 6,
					}}
					onClick={(e) => e.stopPropagation()}
				>
					{allFields.map((f) => {
						const fName = f.name ?? "—";
						const fType = f.atType ?? "unknown";
						const fAcc = f.acc;
						const isPlain = fAcc === "plain";

						return (
							<div key={f.id}>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										padding: "3px 0",
										fontSize: 11,
										gap: 8,
									}}
								>
									<div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
										<span style={{ color: "var(--color-text-secondary, #8a8a8a)" }}>{fName}</span>
										<Pill type={fType}>{fType}</Pill>
									</div>
									<div style={{ textAlign: "right", maxWidth: "55%", wordBreak: "break-all" }}>
										{isPlain ? (
											<span style={{ color: "var(--color-text-primary, #fafafa)", fontWeight: 500 }}>
												{f.value ?? "—"}
											</span>
										) : (
											<EncryptedBadge />
										)}
									</div>
								</div>
								{!isPlain && f.pricing != null && Number(f.pricing.price) > 0 && (
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											padding: "2px 0 4px 16px",
											fontSize: 10,
										}}
									>
										<span style={{ color: "var(--color-text-tertiary, #5a5a5a)" }}>price</span>
										<Pill variant="green">${Number(f.pricing.price).toFixed(2)} USDC</Pill>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</BaseCard>
	);
};

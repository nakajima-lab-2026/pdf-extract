import {
	Button,
	Description,
	FieldError,
	Input,
	Label,
	Spinner,
	Switch,
	TextField,
} from "@heroui/react";
import { useCallback } from "react";
import { formatFileSize } from "../lib/format";
import type { PdfMetadata } from "../lib/pdf-service";

type ParsedOk = { ok: true; indices: number[] };
type ParsedError = { ok: false; error: string };
type ParsedResult = ParsedOk | ParsedError;

type ExtractionPanelProps = {
	metadata: PdfMetadata;
	parsedResult: ParsedResult;
	pagesInput: string;
	onPagesInputChange: (value: string) => void;
	useLabels: boolean;
	onUseLabelsChange: (value: boolean) => void;
	onExtract: (indices: number[]) => void;
	isExtracting: boolean;
};

export function ExtractionPanel({
	metadata,
	parsedResult,
	pagesInput,
	onPagesInputChange,
	useLabels,
	onUseLabelsChange,
	onExtract,
	isExtracting,
}: ExtractionPanelProps) {
	const canExtract =
		parsedResult.ok && parsedResult.indices.length > 0 && !isExtracting;

	const handleExtract = useCallback(() => {
		if (parsedResult.ok && parsedResult.indices.length > 0) {
			onExtract(parsedResult.indices);
		}
	}, [parsedResult, onExtract]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (
				e.key === "Enter" &&
				parsedResult.ok &&
				parsedResult.indices.length > 0
			) {
				handleExtract();
			}
		},
		[parsedResult, handleExtract],
	);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-base font-semibold text-gray-800">
						{metadata.fileName}
					</h3>
					<p className="text-xs text-gray-400">
						{metadata.totalPages} ページ · {formatFileSize(metadata.fileSize)}
					</p>
				</div>
				{metadata.hasCustomLabels && (
					<Switch
						size="sm"
						isSelected={useLabels}
						onChange={onUseLabelsChange}
						className="group"
					>
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
						<Switch.Content>
							<Label
								className={`text-xs font-bold transition-colors ${
									useLabels ? "text-amber-600" : "text-gray-600"
								}`}
							>
								ラベルモード
							</Label>
						</Switch.Content>
					</Switch>
				)}
			</div>

			<TextField
				id="page-spec-input"
				isInvalid={!parsedResult.ok}
				className="flex flex-col gap-1.5"
			>
				<div className="flex items-center justify-between">
					<Label className="text-sm font-medium text-gray-700">
						ページ指定
					</Label>
				</div>
				<Input
					placeholder={
						useLabels
							? 'ラベルで指定 (例: "i-v", "i,iii,v")'
							: 'インデックスで指定 (例: "1,3,5-7")'
					}
					value={pagesInput}
					onChange={(e) => onPagesInputChange(e.target.value)}
					onKeyDown={handleKeyDown}
					className="font-mono"
					autoFocus
				/>
				{!parsedResult.ok ? (
					<FieldError className="text-xs text-danger">
						{parsedResult.error}
					</FieldError>
				) : (
					parsedResult.ok &&
					parsedResult.indices.length > 0 && (
						<Description className="text-xs text-gray-500">
							{parsedResult.indices.length} ページを抽出します
						</Description>
					)
				)}
			</TextField>

			<Button
				id="extract-button"
				variant="primary"
				size="lg"
				isDisabled={!canExtract}
				onPress={handleExtract}
				className="font-semibold"
			>
				{isExtracting ? (
					<div className="flex items-center gap-2">
						<Spinner size="sm" color="current" />
						<span>抽出中...</span>
					</div>
				) : canExtract ? (
					`${parsedResult.ok ? parsedResult.indices.length : 0} ページを抽出`
				) : (
					"ページを指定してください"
				)}
			</Button>
		</div>
	);
}

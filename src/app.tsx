import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { ExtractionPanel } from "./components/extraction-panel";
import { PageLabelViewer } from "./components/page-label-viewer";
import { PdfDropZone } from "./components/pdf-drop-zone";
import {
	parsePagesByIndex,
	parsePagesByLabel,
	validateIndices,
} from "./lib/page-spec-parser";
import type { PdfMetadata } from "./lib/pdf-service";
import {
	extractPages,
	loadPdfMetadata,
	triggerDownload,
} from "./lib/pdf-service";

export const App: FC = () => {
	const [metadata, setMetadata] = useState<PdfMetadata | null>(null);
	const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isExtracting, setIsExtracting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [pagesInput, setPagesInput] = useState("");
	const [useLabels, setUseLabels] = useState(false);

	const handleFileLoad = useCallback(
		async (buffer: ArrayBuffer, fileName: string) => {
			setIsLoading(true);
			setError(null);
			setPagesInput("");
			setUseLabels(false);
			try {
				const meta = await loadPdfMetadata(buffer, fileName);
				setMetadata(meta);
				setPdfBuffer(buffer);
			} catch (e) {
				setError(`PDFの読み込みに失敗しました: ${(e as Error).message}`);
				setMetadata(null);
				setPdfBuffer(null);
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	const parsedResult = useMemo(() => {
		if (!metadata) return { ok: true as const, indices: [] };
		const trimmed = pagesInput.trim();
		if (trimmed === "") return { ok: true as const, indices: [] };
		try {
			const indices = useLabels
				? parsePagesByLabel(trimmed, metadata.labelToIndex)
				: parsePagesByIndex(trimmed);
			validateIndices(indices, metadata.totalPages);
			return { ok: true as const, indices };
		} catch (e) {
			return { ok: false as const, error: (e as Error).message };
		}
	}, [pagesInput, useLabels, metadata]);

	const selectedSet = useMemo(
		() => (parsedResult.ok ? new Set(parsedResult.indices) : new Set<number>()),
		[parsedResult],
	);

	const handleExtract = useCallback(
		async (indices: number[]) => {
			if (!pdfBuffer) return;
			setIsExtracting(true);
			setError(null);
			try {
				const result = await extractPages(pdfBuffer, indices);
				const baseName = metadata?.fileName.replace(/\.pdf$/i, "") ?? "output";
				triggerDownload(result, `${baseName}_extracted.pdf`);
			} catch (e) {
				setError(`抽出に失敗しました: ${(e as Error).message}`);
			} finally {
				setIsExtracting(false);
			}
		},
		[pdfBuffer, metadata],
	);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-2xl px-4 py-12">
				<header className="mb-8 text-center">
					<h1 className="text-3xl font-bold tracking-tight text-gray-900">
						pdf-extract
					</h1>
					<p className="mt-2 text-sm text-gray-500">
						ページ指定でPDFを高速に抽出. ブラウザ完結.
					</p>
				</header>

				<main className="flex flex-col gap-6">
					<PdfDropZone
						onFileLoad={handleFileLoad}
						isLoading={isLoading}
						hasFile={metadata !== null}
					/>

					{error && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
							{error}
						</div>
					)}

					{metadata && (
						<div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
							<ExtractionPanel
								metadata={metadata}
								parsedResult={parsedResult}
								pagesInput={pagesInput}
								onPagesInputChange={setPagesInput}
								useLabels={useLabels}
								onUseLabelsChange={setUseLabels}
								onExtract={handleExtract}
								isExtracting={isExtracting}
							/>
							<div className="border-t border-gray-200 pt-4">
								<PageLabelViewer
									pages={metadata.pages}
									selectedIndices={selectedSet}
								/>
							</div>
						</div>
					)}
				</main>

				<footer className="mt-12 text-center text-xs text-gray-400">
					<p>
						すべての処理はブラウザ内で完結します。ファイルは外部に送信されません。
					</p>
				</footer>
			</div>
		</div>
	);
};

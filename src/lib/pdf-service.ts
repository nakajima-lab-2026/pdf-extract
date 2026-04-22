import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
	"pdfjs-dist/build/pdf.worker.min.mjs",
	import.meta.url,
).toString();

export type PageInfo = {
	index: number;
	label: string;
};

export type PdfMetadata = {
	totalPages: number;
	pages: PageInfo[];
	labelToIndex: Map<string, number>;
	hasCustomLabels: boolean;
	fileName: string;
	fileSize: number;
};

export async function loadPdfMetadata(
	buffer: ArrayBuffer,
	fileName: string,
): Promise<PdfMetadata> {
	const pdf = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
	const totalPages = pdf.numPages;
	const labels = await pdf.getPageLabels();
	const pages: PageInfo[] = [];
	const labelToIndex = new Map<string, number>();
	let hasCustomLabels = false;

	for (let i = 0; i < totalPages; i++) {
		const label = labels?.[i] ?? String(i + 1);
		pages.push({ index: i, label });
		if (!labelToIndex.has(label)) {
			labelToIndex.set(label, i);
		}
		if (label !== String(i + 1)) {
			hasCustomLabels = true;
		}
	}

	pdf.destroy();

	return {
		totalPages,
		pages,
		labelToIndex,
		hasCustomLabels,
		fileName,
		fileSize: buffer.byteLength,
	};
}

export async function extractPages(
	sourceBuffer: ArrayBuffer,
	indices: number[],
): Promise<Uint8Array> {
	const sourcePdf = await PDFDocument.load(sourceBuffer);
	const destPdf = await PDFDocument.create();
	const copiedPages = await destPdf.copyPages(sourcePdf, indices);
	for (const page of copiedPages) {
		destPdf.addPage(page);
	}
	return destPdf.save();
}

export function triggerDownload(data: Uint8Array, fileName: string): void {
	const blob = new Blob([data as unknown as BlobPart], {
		type: "application/pdf",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(url);
}

import { useCallback, useRef, useState } from "react";

type PdfDropZoneProps = {
	onFileLoad: (buffer: ArrayBuffer, fileName: string) => void;
	isLoading: boolean;
	hasFile: boolean;
};

export function PdfDropZone({
	onFileLoad,
	isLoading,
	hasFile,
}: PdfDropZoneProps) {
	const [isDragOver, setIsDragOver] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFile = useCallback(
		(file: File) => {
			if (file.type !== "application/pdf") {
				return;
			}
			const reader = new FileReader();
			reader.onload = () => {
				if (reader.result instanceof ArrayBuffer) {
					onFileLoad(reader.result, file.name);
				}
			};
			reader.readAsArrayBuffer(file);
		},
		[onFileLoad],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragOver(false);
			const file = e.dataTransfer.files[0];
			if (file) handleFile(file);
		},
		[handleFile],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
	}, []);

	const handleClick = useCallback(() => {
		inputRef.current?.click();
	}, []);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) handleFile(file);
		},
		[handleFile],
	);

	return (
		<button
			type="button"
			onDrop={handleDrop}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onClick={handleClick}
			className={`
				w-full rounded-xl border-2 border-dashed p-12
				transition-all duration-200 cursor-pointer text-center
				${
					isDragOver
						? "border-blue-500 bg-blue-50 scale-[1.01]"
						: "border-gray-300 bg-white hover:border-gray-400"
				}
				${isLoading ? "opacity-60 pointer-events-none" : ""}
			`}
		>
			<input
				ref={inputRef}
				type="file"
				accept="application/pdf"
				className="hidden"
				onChange={handleChange}
			/>
			<div className="flex flex-col items-center gap-3">
				<div className="text-4xl">{isLoading ? "⏳" : "📄"}</div>
				<p className="text-lg font-medium text-gray-700">
					{isLoading
						? "読み込み中..."
						: hasFile
							? "別のPDFをドロップして差し替え"
							: "PDFをドラッグ＆ドロップ、またはクリック"}
				</p>
				{!hasFile && !isLoading && (
					<p className="text-sm text-gray-400">
						ファイルはブラウザ内でのみ処理され、外部には送信されません
					</p>
				)}
			</div>
		</button>
	);
}

type LabelToIndex = Map<string, number>;

export function parsePagesByIndex(pagesStr: string): number[] {
	const indices: number[] = [];
	for (const raw of pagesStr.split(",")) {
		const part = raw.trim();
		if (part === "") continue;
		if (part.includes("-")) {
			const [startStr, endStr] = part.split("-", 2);
			const start = Number.parseInt(startStr.trim(), 10);
			const end = Number.parseInt(endStr.trim(), 10);
			if (Number.isNaN(start) || Number.isNaN(end)) {
				throw new Error(`無効な範囲指定: "${part}"`);
			}
			if (start > end) {
				throw new Error(`開始ページが終了ページより大きいです: "${part}"`);
			}
			for (let i = start - 1; i < end; i++) {
				indices.push(i);
			}
		} else {
			const page = Number.parseInt(part, 10);
			if (Number.isNaN(page)) {
				throw new Error(`無効なページ番号: "${part}"`);
			}
			indices.push(page - 1);
		}
	}
	return indices;
}

export function parsePagesByLabel(
	pagesStr: string,
	labelToIndex: LabelToIndex,
): number[] {
	const indices: number[] = [];
	for (const raw of pagesStr.split(",")) {
		const part = raw.trim();
		if (part === "") continue;
		if (part.includes("-")) {
			const [startLabel, endLabel] = part.split("-", 2).map((s) => s.trim());
			const startIdx = labelToIndex.get(startLabel);
			const endIdx = labelToIndex.get(endLabel);
			if (startIdx === undefined) {
				throw new Error(`ラベル "${startLabel}" が見つかりません`);
			}
			if (endIdx === undefined) {
				throw new Error(`ラベル "${endLabel}" が見つかりません`);
			}
			const [lo, hi] =
				startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
			for (let i = lo; i <= hi; i++) {
				indices.push(i);
			}
		} else {
			const idx = labelToIndex.get(part);
			if (idx === undefined) {
				throw new Error(`ラベル "${part}" が見つかりません`);
			}
			indices.push(idx);
		}
	}
	return indices;
}

export function validateIndices(indices: number[], totalPages: number): void {
	for (const idx of indices) {
		if (idx < 0 || idx >= totalPages) {
			throw new Error(
				`ページインデックス ${idx + 1} は範囲外です (1-${totalPages})`,
			);
		}
	}
}

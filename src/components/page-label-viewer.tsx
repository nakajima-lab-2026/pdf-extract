import { Chip, ScrollShadow } from "@heroui/react";
import type { PageInfo } from "../lib/pdf-service";

type PageLabelViewerProps = {
	pages: PageInfo[];
	selectedIndices: Set<number>;
};

export function PageLabelViewer({
	pages,
	selectedIndices,
}: PageLabelViewerProps) {
	const hasCustomLabels = pages.some((p) => p.label !== String(p.index + 1));

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-gray-600">
					ページ一覧
					{hasCustomLabels && (
						<span className="ml-2 text-xs text-amber-500 font-normal">
							カスタムラベルあり
						</span>
					)}
				</h3>
				<span className="text-xs text-gray-400">
					{selectedIndices.size > 0
						? `${selectedIndices.size} / ${pages.length} 選択中`
						: `${pages.length} ページ`}
				</span>
			</div>
			<ScrollShadow className="max-h-48">
				<div className="flex flex-wrap gap-1.5">
					{pages.map((page) => {
						const isSelected = selectedIndices.has(page.index);
						const showLabel = page.label !== String(page.index + 1);
						return (
							<Chip
								key={page.index}
								size="sm"
								variant={isSelected ? "primary" : "soft"}
								color={isSelected ? "accent" : "default"}
								className="transition-all duration-200"
							>
								{showLabel ? (
									<span>
										<span className="opacity-50">{page.index + 1}:</span>
										{page.label}
									</span>
								) : (
									page.index + 1
								)}
							</Chip>
						);
					})}
				</div>
			</ScrollShadow>
		</div>
	);
}

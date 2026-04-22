import argparse
import sys
from pathlib import Path

import fitz  # pymupdf


def extract_pages(doc: fitz.Document, indices: list[int], output_path: Path) -> None:
    """指定されたインデックスのページを抽出して新しいPDFを作成する"""
    total_pages = len(doc)

    new_doc = fitz.open()
    for idx in indices:
        if idx < 0 or idx >= total_pages:
            raise ValueError(f"インデックス {idx} は範囲外です (0-{total_pages - 1})")
        new_doc.insert_pdf(doc, from_page=idx, to_page=idx)

    new_doc.save(output_path)
    new_doc.close()


def parse_pages_by_index(pages_str: str) -> list[int]:
    """ページ指定文字列をパースする (例: "1,3,5-7" -> [0,2,4,5,6])

    ユーザー入力は1-based、返り値は0-basedインデックス
    """
    indices = []
    for part in pages_str.split(","):
        part = part.strip()
        if "-" in part:
            start, end = part.split("-", 1)
            indices.extend(range(int(start) - 1, int(end)))
        else:
            indices.append(int(part) - 1)
    return indices


def parse_pages_by_label(pages_str: str, label_to_index: dict[str, int]) -> list[int]:
    """ラベル指定文字列をパースする (例: "i,ii,iii" or "i-v")

    範囲指定の場合、ラベルリスト内での位置ベースで範囲を取得
    """
    indices = []
    for part in pages_str.split(","):
        part = part.strip()
        if "-" in part:
            start_label, end_label = part.split("-", 1)
            start_label = start_label.strip()
            end_label = end_label.strip()
            if start_label not in label_to_index:
                raise ValueError(f"ラベル '{start_label}' が見つかりません")
            if end_label not in label_to_index:
                raise ValueError(f"ラベル '{end_label}' が見つかりません")
            start_idx = label_to_index[start_label]
            end_idx = label_to_index[end_label]
            if start_idx > end_idx:
                start_idx, end_idx = end_idx, start_idx
            indices.extend(range(start_idx, end_idx + 1))
        else:
            if part not in label_to_index:
                raise ValueError(f"ラベル '{part}' が見つかりません")
            indices.append(label_to_index[part])
    return indices


def build_label_to_index(doc: fitz.Document) -> dict[str, int]:
    """ラベルからインデックスへのマッピングを作成

    重複ラベルがある場合は最初の出現位置を使用
    """
    mapping = {}
    for idx in range(len(doc)):
        label = doc[idx].get_label()
        if label not in mapping:
            mapping[label] = idx
    return mapping


def main() -> None:
    parser = argparse.ArgumentParser(description="PDFからページを抽出する")
    parser.add_argument("input", type=Path, help="入力PDFファイル")
    parser.add_argument("-f", "--from", dest="from_page", type=str, help="開始ページ")
    parser.add_argument("-t", "--to", dest="to_page", type=str, help="終了ページ")
    parser.add_argument(
        "-p", "--pages", type=str, help="抽出するページ (例: 1,3,5-7)"
    )
    parser.add_argument("-o", "--output", type=Path, help="出力ファイル名")
    parser.add_argument(
        "-l", "--by-label", action="store_true",
        help="ページ番号をラベル（ローマ数字等）として解釈する"
    )

    args = parser.parse_args()

    if not args.input.exists():
        print(f"エラー: 入力ファイル '{args.input}' が見つかりません", file=sys.stderr)
        raise SystemExit(1)

    doc = fitz.open(args.input)

    try:
        if args.by_label:
            label_to_index = build_label_to_index(doc)

            if args.pages:
                indices = parse_pages_by_label(args.pages, label_to_index)
                default_output = f"{args.pages.replace(',', '_')}.pdf"
            elif args.from_page and args.to_page:
                if args.from_page not in label_to_index:
                    print(f"エラー: ラベル '{args.from_page}' が見つかりません", file=sys.stderr)
                    raise SystemExit(1)
                if args.to_page not in label_to_index:
                    print(f"エラー: ラベル '{args.to_page}' が見つかりません", file=sys.stderr)
                    raise SystemExit(1)
                start_idx = label_to_index[args.from_page]
                end_idx = label_to_index[args.to_page]
                if start_idx > end_idx:
                    start_idx, end_idx = end_idx, start_idx
                indices = list(range(start_idx, end_idx + 1))
                default_output = f"{args.from_page}-{args.to_page}.pdf"
            elif args.from_page:
                if args.from_page not in label_to_index:
                    print(f"エラー: ラベル '{args.from_page}' が見つかりません", file=sys.stderr)
                    raise SystemExit(1)
                indices = [label_to_index[args.from_page]]
                default_output = f"{args.from_page}.pdf"
            else:
                parser.error("--from/--to または --pages を指定してください")
        else:
            if args.pages:
                indices = parse_pages_by_index(args.pages)
                default_output = f"{args.pages.replace(',', '_')}.pdf"
            elif args.from_page and args.to_page:
                from_page = int(args.from_page)
                to_page = int(args.to_page)
                indices = list(range(from_page - 1, to_page))
                default_output = f"{from_page}-{to_page}.pdf"
            elif args.from_page:
                from_page = int(args.from_page)
                indices = [from_page - 1]
                default_output = f"{from_page}.pdf"
            else:
                parser.error("--from/--to または --pages を指定してください")

        out_dir = Path(__file__).resolve().parents[2] / "out"
        out_dir.mkdir(exist_ok=True)

        output_path = out_dir / (args.output or Path(default_output))

        if output_path.exists():
            print(f"エラー: {output_path} は既に存在します", file=sys.stderr)
            raise SystemExit(1)

        extract_pages(doc, indices, output_path)
        print(f"抽出完了: {output_path} ({len(indices)}ページ)")

    except ValueError as e:
        print(f"エラー: {e}", file=sys.stderr)
        raise SystemExit(1)
    finally:
        doc.close()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Convert the exam spreadsheet (Drive export, .xlsx) to eval/exam.jsonl.

    python3 scripts/exam-xlsx-to-jsonl.py <exam.xlsx> [eval/exam.jsonl]

Gold answers are copied verbatim (no edits). eval/ is never bundled, served or
ingested (see _shared/ingest-ignore.ts). Needs openpyxl.
"""
import datetime
import json
import sys

import openpyxl

FIELDS = [
    "id", "section", "question_es", "gold_answer", "primary_source_url", "date_checked",
    "fails_if", "verificar", "type", "valid_until", "last_reviewed",
]


# Only valid_until may be empty (null = no expiry); every other empty cell is ""
# (same shape as the original 2026-10-03 conversion; the scorer trims strings).
NULLABLE = {"valid_until"}


def cell(field, value):
    empty = None if field in NULLABLE else ""
    if value is None:
        return empty
    if isinstance(value, (datetime.datetime, datetime.date)):
        return value.strftime("%Y-%m-%d")
    text = str(value)
    return text if text.strip() else empty


def main() -> None:
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else "eval/exam.jsonl"
    ws = openpyxl.load_workbook(src, data_only=True).worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    header = [str(h).strip() if h is not None else "" for h in rows[0]]
    missing = [f for f in FIELDS if f not in header]
    if missing:
        sys.exit(f"missing columns: {missing}")
    out = []
    for raw in rows[1:]:
        record = dict(zip(header, raw))
        if not record.get("id"):
            continue
        out.append({f: cell(f, record.get(f)) for f in FIELDS})
    with open(dst, "w", encoding="utf-8") as fh:
        for r in out:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"{len(out)} rows -> {dst}")


if __name__ == "__main__":
    main()

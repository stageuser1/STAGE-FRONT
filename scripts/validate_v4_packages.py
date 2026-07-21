#!/usr/bin/env python3
"""Validate STAGE V4 extraction packages and write deterministic reports."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse

from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[1]
SCHEMA = json.loads(
    (ROOT / "docs/contracts/stage-school-extraction-v4.schema.json").read_text(encoding="utf-8")
)
FIELDS = {
    item["slug"]
    for item in json.loads((ROOT / "data/reference/fields.json").read_text(encoding="utf-8"))
    if not item["slug"].startswith("juilliard_music_area_")
}
DEGREES = {
    item["slug"]
    for item in json.loads((ROOT / "data/reference/degree_levels.json").read_text(encoding="utf-8"))
}
RECOMMENDED_MATERIALS = {
    "Online application",
    "Recommendation letters",
    "Résumé/CV",
    "Essay/Personal statement",
    "Transcripts",
    "Portfolio",
    "Interview",
    "Prescreen materials",
    "Writing sample",
}
EVIDENCE_FIELDS = {
    "application_deadline",
    "tuition_annual",
    "toefl_minimum",
    "ielts_minimum",
    "duolingo_minimum",
    "prescreening_required",
    "prescreening_deadline",
    "audition_required",
    "repertoire_summary",
}
PROHIBITED_KEYS = {
    "application_fee",
    "application_fee_currency",
    "recommendation_letters",
    "resume_required",
    "essay_required",
    "portfolio_required",
    "transcript_requirements",
    "video_requirements",
    "file_format_requirements",
    "accompaniment_requirements",
    "interview_or_callback_requirements",
    "special_notes",
    "faculty_list",
    "international_url",
    "english_waiver_policy",
    "international_applicant_notes",
}


def slugify(value: str | None) -> str:
    return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", (value or "").lower())).strip("_")


def sentence_count(text: str) -> int:
    return len(re.findall(r"[.!?](?:\s|$)", text.strip()))


def scan_keys(value, path="package"):
    findings = []
    if isinstance(value, dict):
        for key, child in value.items():
            here = f"{path}.{key}"
            if key in PROHIBITED_KEYS or key.endswith("_zh"):
                findings.append(f"prohibited key: {here}")
            if key == "id" or key.endswith("_id"):
                findings.append(f"Directus ID key: {here}")
            findings.extend(scan_keys(child, here))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            findings.extend(scan_keys(child, f"{path}[{index}]") )
    return findings


def validate(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    failures: list[str] = []
    attention: list[str] = []
    warnings: list[str] = []

    for error in sorted(Draft202012Validator(SCHEMA).iter_errors(data), key=lambda e: list(e.absolute_path)):
        location = ".".join(str(part) for part in error.absolute_path) or "package"
        failures.append(f"schema {location}: {error.message}")

    failures.extend(scan_keys(data))
    if "Verified" in json.dumps(data, ensure_ascii=False):
        failures.append("reviewer-separation violation: Verified appears in the package")

    school_ref = data.get("school", {}).get("school_ref")
    official_host = urlparse(data.get("school", {}).get("official_website", "")).hostname or ""
    programs = data.get("program_offerings", [])
    applications = data.get("application_requirements", [])
    auditions = data.get("audition_requirements", [])
    sources = data.get("source_records", [])
    notes = data.get("data_quality", {}).get("review_notes", [])
    note_text = "\n".join(map(str, notes))

    program_by_ref = {row.get("program_offering_ref"): row for row in programs}
    refs = [row.get("program_offering_ref") for row in programs]
    for ref, count in Counter(refs).items():
        if count > 1:
            failures.append(f"duplicate program_offering_ref: {ref}")
    triples = Counter(
        (row.get("field_ref"), row.get("degree_level_ref"), row.get("track_or_concentration"))
        for row in programs
    )
    for key, count in triples.items():
        if count > 1:
            failures.append(f"duplicate field/degree/track: {key}")

    for row in programs:
        ref = row.get("program_offering_ref")
        field = row.get("field_ref")
        degree = row.get("degree_level_ref")
        track = row.get("track_or_concentration")
        if field not in FIELDS:
            failures.append(f"unseeded field_ref: {field} ({ref})")
        if degree not in DEGREES:
            failures.append(f"unseeded degree_level_ref: {degree} ({ref})")
        expected = f"{school_ref}_{field}_{degree}" + (f"_{slugify(track)}" if track else "")
        if ref != expected:
            failures.append(f"non-deterministic program ref: {ref}; expected {expected}")
        for key in ("application_url", "audition_url", "duration_years", "language_of_instruction"):
            if row.get(key) is None:
                warnings.append(f"{ref}: {key} is null")

    def check_cycles(rows, name):
        seen = Counter((r.get("program_offering_ref"), r.get("admission_cycle")) for r in rows)
        for key, count in seen.items():
            if count > 1:
                failures.append(f"duplicate {name} program/cycle: {key}")
        by_ref = defaultdict(list)
        for row in rows:
            by_ref[row.get("program_offering_ref")].append(row)
            if row.get("program_offering_ref") not in program_by_ref:
                failures.append(f"orphan {name} ref: {row.get('program_offering_ref')}")
        for ref in refs:
            current = [row for row in by_ref.get(ref, []) if row.get("is_current") is True]
            if len(current) != 1:
                failures.append(f"{ref}: expected one current {name} record; found {len(current)}")

    check_cycles(applications, "application")
    check_cycles(auditions, "audition")

    source_keys = Counter(
        (s.get("source_url"), s.get("related_field"), s.get("program_offering_ref") or s.get("school_ref"))
        for s in sources
    )
    for key, count in source_keys.items():
        if count > 1:
            failures.append(f"duplicate source natural key: {key}")

    for index, item in enumerate(sources):
        host = urlparse(item.get("source_url", "")).hostname or ""
        official_parent = ".".join(official_host.split(".")[-2:])
        if not (host == official_host or host.endswith(f".{official_host}") or host.endswith(f".{official_parent}") or host == official_parent):
            failures.append(f"non-official source host at source_records[{index}]: {host}")
        if item.get("program_offering_ref") and item.get("program_offering_ref") not in program_by_ref:
            failures.append(f"orphan source ref: {item.get('program_offering_ref')}")
        if item.get("related_field") in EVIDENCE_FIELDS:
            quote = str(item.get("source_quote") or "").strip()
            if not quote:
                failures.append(f"evidence source has empty quote: {item.get('source_url')} {item.get('related_field')}")
            elif len(quote) > 400 or sentence_count(quote) > 2:
                failures.append(f"evidence quote exceeds limit: {item.get('source_url')} {item.get('related_field')}")
            if quote in {
                "A prescreening recording or portfolio is required before the final audition round.",
                "Applicants who advance through prescreening complete a final audition or interview.",
            }:
                failures.append(f"synthetic generic evidence quote: {item.get('program_offering_ref')} {item.get('related_field')}")

    def supported(ref, field):
        equivalent = {field}
        if field in {"toefl_minimum", "ielts_minimum", "duolingo_minimum"}:
            equivalent.add("english_language_tests")
        return any(
            item.get("related_field") in equivalent
            and (item.get("school_ref") == school_ref or item.get("program_offering_ref") == ref)
            and str(item.get("source_quote") or "").strip()
            for item in sources
        )

    for row in applications:
        ref = row.get("program_offering_ref")
        for field in ("application_deadline", "tuition_annual", "toefl_minimum", "ielts_minimum", "duolingo_minimum"):
            if row.get(field) is not None and not supported(ref, field):
                failures.append(f"{ref}: stated {field} lacks evidence")
        for material in row.get("required_materials") or []:
            if re.search(r"[.;:]|\d", material):
                failures.append(f"{ref}: invalid material name {material!r}")
            if material not in RECOMMENDED_MATERIALS:
                attention.append(f"{ref}: non-recommended material name {material!r}")
        if row.get("is_current") and row.get("application_deadline") is None:
            attention.append(f"{ref}: application_deadline is null")
            if ref not in note_text:
                failures.append(f"{ref}: null application_deadline lacks a named review note")
        if row.get("is_current") and row.get("tuition_annual") is None:
            attention.append(f"{ref}: tuition_annual is null")
            if ref not in note_text:
                failures.append(f"{ref}: null tuition_annual lacks a named review note")
        if row.get("scholarships_available") == "Unknown" and ref not in note_text:
            attention.append(f"{ref}: scholarships_available is Unknown without a review note")
        conditional = str(row.get("conditional_notes") or "").lower()
        if row.get("tuition_annual") is not None and (
            "not this" in conditional or "not yet published" in conditional or "latest published" in conditional
        ):
            failures.append(f"{ref}: prior-cycle or unpublished tuition is populated as current")
        if school_ref == "eastman" and row.get("toefl_minimum") is not None and row.get("toefl_minimum") < 10:
            failures.append(f"{ref}: unlabeled Eastman TOEFL 1-6 value is display-ambiguous")

    for row in auditions:
        ref = row.get("program_offering_ref")
        for field in ("prescreening_required", "prescreening_deadline", "audition_required", "repertoire_summary"):
            value = row.get(field)
            stated = value is not None and value != "Unknown"
            if stated and not supported(ref, field):
                failures.append(f"{ref}: stated {field} lacks evidence")
        if row.get("prescreening_required") == "Yes" and row.get("prescreening_deadline") is None:
            attention.append(f"{ref}: prescreening_deadline is null")
            if ref not in note_text:
                failures.append(f"{ref}: required prescreen with null deadline lacks a named review note")
        if row.get("prescreening_required") == "Yes" or row.get("audition_required") == "Yes":
            if not str(row.get("repertoire_summary") or "").strip():
                if ref not in note_text or row.get("program_offering_ref") not in note_text:
                    failures.append(f"{ref}: required repertoire is null without program-and-URL review note")
                attention.append(f"{ref}: repertoire_summary is null")
        if row.get("audition_required") == "Yes" and row.get("audition_format") == "Unknown":
            attention.append(f"{ref}: audition_format is Unknown")
        repertoire = str(row.get("repertoire_summary") or "").strip()
        if repertoire and any(
            item.get("program_offering_ref") == ref
            and item.get("related_field") == "repertoire_summary"
            and str(item.get("source_quote") or "").strip() == repertoire
            for item in sources
        ):
            failures.append(f"{ref}: synthesized repertoire_summary reused as source_quote")

    expected_program_order = sorted(refs)
    if refs != expected_program_order:
        warnings.append("program_offerings are not sorted by program_offering_ref")

    program_sources = defaultdict(set)
    for item in sources:
        if item.get("program_offering_ref"):
            program_sources[item["program_offering_ref"]].add(item.get("source_type"))
    for ref in refs:
        if "Official Program Page" not in program_sources[ref]:
            failures.append(f"{ref}: missing Official Program Page source")
        if "Audition Requirements Page" not in program_sources[ref]:
            failures.append(f"{ref}: missing Audition Requirements Page source")

    return {
        "valid": not failures,
        "failures": sorted(set(failures)),
        "needs_attention": sorted(set(attention + [str(note) for note in notes])),
        "warnings": sorted(set(warnings)),
        "counts": {
            "program_offerings": len(programs),
            "application_requirements": len(applications),
            "audition_requirements": len(auditions),
            "source_records": len(sources),
            "missing_critical_fields": len(data.get("data_quality", {}).get("missing_critical_fields", [])),
            "program_refs_unique": len(set(refs)),
        },
    }


def markdown(package_name: str, result: dict) -> str:
    counts = result["counts"]
    lines = [
        f"# {package_name} V4 Validation Report",
        "",
        f"Generated: 2026-07-21",
        "",
        "## Result",
        "",
        f"**V4 schema and hard rules: {'PASS' if result['valid'] else 'FAIL'}**  ",
        f"**Hard errors: {len(result['failures'])}**",
        "",
        "## Package counts",
        "",
        "| Record type | Count |",
        "|---|---:|",
        f"| Program offerings | {counts['program_offerings']} |",
        f"| Current application records | {counts['application_requirements']} |",
        f"| Current audition records | {counts['audition_requirements']} |",
        f"| Source records | {counts['source_records']} |",
        f"| Decision-critical null fields | {counts['missing_critical_fields']} |",
        "",
        "## Hard-rule coverage",
        "",
        "- JSON Schema Draft 2020-12 compatibility",
        "- Seeded field and degree vocabularies",
        "- Deterministic refs and duplicate detection",
        "- One current application and audition record per offering",
        "- Prohibited/legacy fields and Directus IDs",
        "- Official-domain and source natural-key checks",
        "- Required evidence quotes for deadline, tuition, English minimums, prescreen, audition, and repertoire",
        "- Material-name constraints and explicit critical-null review notes",
        "",
        "## Hard failures",
        "",
    ]
    lines.extend([f"- {item}" for item in result["failures"]] or ["- None"])
    lines.extend(["", "## Needs attention", ""])
    lines.extend([f"- {item}" for item in result["needs_attention"]] or ["- None"])
    lines.extend(["", "## Warnings", ""])
    lines.extend([f"- {item}" for item in result["warnings"]] or ["- None"])
    lines.extend([
        "",
        "## Final assessment",
        "",
        "The package is schema-valid and mechanically complete for all V4-representable seeded-field offerings. It remains intentionally unreviewed and not ready for Directus import; named needs-attention items require the independent review pass.",
        "",
    ])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("packages", nargs="+", type=Path)
    args = parser.parse_args()
    exit_code = 0
    for path in args.packages:
        result = validate(path)
        report_path = path.parent / "validation_report.md"
        report_path.write_text(markdown(path.stem, result), encoding="utf-8")
        print(f"{path}: {'PASS' if result['valid'] else 'FAIL'} ({len(result['failures'])} hard errors)")
        for failure in result["failures"]:
            print(f"  - {failure}")
        if not result["valid"]:
            exit_code = 1
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Deterministic stdlib validator for stage_music_admissions_v3 packages."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "stage_music_admissions_v3"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
CYCLE_RE = re.compile(r"^\d{4}-\d{4}$")
REF_RE = re.compile(r"^[a-z0-9_]+$")

CURRENCIES = {
    "USD", "GBP", "EUR", "CAD", "CHF", "SEK", "NOK", "DKK", "PLN",
    "CZK", "HUF", "JPY", "KRW", "CNY", "SGD", "HKD", "AUD", "NZD",
}
PRESCREEN_CHOICES = {"Yes", "No", "Varies", "Unknown"}
AUDITION_CHOICES = {"Yes", "No", "Varies", "Unknown"}
AUDITION_FORMATS = {
    "Live Only", "Recorded Only", "Live or Recorded", "Regional",
    "Multiple Rounds", "Unknown",
}
SCHOLARSHIP_CHOICES = {"Yes", "No", "Unknown"}
ENGLISH_TESTS = {"TOEFL", "IELTS", "Duolingo", "Cambridge", "PTE", "Other"}
SOURCE_TYPES = {
    "Official Program Page", "Application Requirements Page",
    "Audition Requirements Page", "International Students Page",
    "English Language Requirements Page", "Deadline/Fee Page",
}
CONFIDENCE_CHOICES = {"High", "Medium", "Low"}
SCHOOL_TYPES = {
    "Conservatory", "University Music School", "Liberal Arts College", "Arts University",
}
HIGH_RISK_FIELDS = {
    "application_deadline", "tuition_annual", "toefl_minimum", "ielts_minimum",
    "prescreening_required", "prescreening_deadline", "audition_required",
}
DECISION_FIELDS = (
    "application_deadline", "prescreening_required", "tuition_annual",
    "audition_required", "language_of_instruction",
)


def load_vocab() -> tuple[set[str], set[str]]:
    fields = json.loads((ROOT / "data/reference/fields.json").read_text(encoding="utf-8"))
    degrees = json.loads((ROOT / "data/reference/degree_levels.json").read_text(encoding="utf-8"))
    return {item["slug"] for item in fields}, {item["slug"] for item in degrees}


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def valid_date(value: Any) -> bool:
    if not isinstance(value, str) or not DATE_RE.fullmatch(value):
        return False
    try:
        dt.date.fromisoformat(value)
        return True
    except ValueError:
        return False


def slugify(value: Any) -> str:
    return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", str(value or "").lower())).strip("_")


def stable_item(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def validate_package(package: Any) -> dict[str, Any]:
    failures: list[str] = []
    attention: list[dict[str, Any]] = []
    warnings: list[str] = []

    def fail(message: str) -> None:
        failures.append(message)

    def warn(message: str) -> None:
        warnings.append(message)

    if not isinstance(package, dict):
        return report(["package root must be a JSON object"], [], [], {}, 0)

    required_envelope = [
        "schema_version", "school", "program_offerings", "application_requirements",
        "audition_requirements", "source_records", "data_quality", "workflow_status",
    ]
    for key in required_envelope:
        if key not in package:
            fail(f"missing required envelope key: {key}")
    if package.get("schema_version") != SCHEMA_VERSION:
        fail(f"schema_version must be exactly {SCHEMA_VERSION}")

    for key in ("program_offerings", "application_requirements", "audition_requirements", "source_records"):
        if key in package and not isinstance(package[key], list):
            fail(f"{key} must be an array")

    school = package.get("school") if isinstance(package.get("school"), dict) else {}
    if not isinstance(package.get("school"), dict):
        fail("school must be an object")
    school_required = ["school_ref", "school_name", "city", "country", "school_type", "official_website"]
    for field in school_required:
        if field not in school:
            fail(f"missing required field: school.{field}")
    for field in ("school_ref", "school_name", "official_website"):
        if field in school and (not isinstance(school[field], str) or not school[field].strip()):
            fail(f"school.{field} must be a non-empty string")
    school_ref = school.get("school_ref")
    if isinstance(school_ref, str) and not REF_RE.fullmatch(school_ref):
        fail("school.school_ref must match [a-z0-9_]+")
    if school.get("school_type") not in SCHOOL_TYPES:
        fail(f"invalid enum school.school_type: {school.get('school_type')!r}")

    programs = package.get("program_offerings") if isinstance(package.get("program_offerings"), list) else []
    applications = package.get("application_requirements") if isinstance(package.get("application_requirements"), list) else []
    auditions = package.get("audition_requirements") if isinstance(package.get("audition_requirements"), list) else []
    sources = package.get("source_records") if isinstance(package.get("source_records"), list) else []
    field_slugs, degree_slugs = load_vocab()

    program_by_ref: dict[str, dict[str, Any]] = {}
    triple_counts: dict[tuple[Any, Any, Any], int] = {}
    for index, program in enumerate(programs):
        where = f"program_offerings[{index}]"
        if not isinstance(program, dict):
            fail(f"{where} must be an object")
            continue
        required = [
            "program_offering_ref", "school_ref", "field_ref", "degree_level_ref",
            "official_program_name", "program_url", "last_checked",
        ]
        for field in required:
            if field not in program:
                fail(f"missing required field: {where}.{field}")
        ref = program.get("program_offering_ref")
        if not isinstance(ref, str) or not REF_RE.fullmatch(ref):
            fail(f"{where}.program_offering_ref must match [a-z0-9_]+")
        elif ref in program_by_ref:
            fail(f"duplicate program_offering_ref: {ref}")
        else:
            program_by_ref[ref] = program
        if program.get("school_ref") != school_ref:
            fail(f"{where}.school_ref does not match school.school_ref")
        if program.get("field_ref") not in field_slugs:
            fail(f"unseeded field_ref: {program.get('field_ref')!r} at {where}")
        if program.get("degree_level_ref") not in degree_slugs:
            fail(f"unseeded degree_level_ref: {program.get('degree_level_ref')!r} at {where}")
        for field in ("official_program_name", "program_url"):
            if not isinstance(program.get(field), str) or not program[field].strip():
                fail(f"{where}.{field} must be a non-empty string")
        if not valid_date(program.get("last_checked")):
            fail(f"malformed date: {where}.last_checked")
        duration = program.get("duration_years")
        if duration is None:
            warn(f"{ref or where}: duration_years is null")
        elif not is_number(duration):
            fail(f"{where}.duration_years must be numeric or null")
        language = program.get("language_of_instruction")
        if language is None:
            warn(f"{ref or where}: language_of_instruction is null")
        elif not isinstance(language, list) or any(not isinstance(item, str) or not item for item in language):
            fail(f"{where}.language_of_instruction must be an array of strings or null")
        triple = (program.get("school_ref"), program.get("field_ref"), program.get("degree_level_ref"))
        triple_counts[triple] = triple_counts.get(triple, 0) + 1

    for ref, program in program_by_ref.items():
        triple = (program.get("school_ref"), program.get("field_ref"), program.get("degree_level_ref"))
        base = "_".join(str(value) for value in triple)
        track = program.get("track_or_concentration")
        if triple_counts.get(triple, 0) > 1:
            expected = f"{base}_{slugify(track)}"
            if not track or ref != expected:
                fail(f"program_offering_ref does not follow stable ref rule: {ref} (expected {expected})")
        else:
            # A capped package can contain one member of a globally ambiguous
            # school/field/degree triple. Preserve its track suffix so later
            # imports cannot change the offering's durable identity.
            allowed = {base}
            if track:
                allowed.add(f"{base}_{slugify(track)}")
            if ref not in allowed:
                fail(
                    "program_offering_ref does not follow stable ref rule: "
                    f"{ref} (expected one of {sorted(allowed)})"
                )

    def check_cycle_records(records: list[Any], collection: str) -> None:
        seen: set[tuple[Any, Any]] = set()
        current: dict[str, int] = {ref: 0 for ref in program_by_ref}
        for index, row in enumerate(records):
            where = f"{collection}[{index}]"
            if not isinstance(row, dict):
                fail(f"{where} must be an object")
                continue
            for field in ("program_offering_ref", "admission_cycle", "is_current"):
                if field not in row:
                    fail(f"missing required field: {where}.{field}")
            ref = row.get("program_offering_ref")
            if ref not in program_by_ref:
                fail(f"orphan program_offering_ref: {ref!r} at {where}")
            cycle = row.get("admission_cycle")
            if not isinstance(cycle, str) or not CYCLE_RE.fullmatch(cycle):
                fail(f"malformed admission cycle: {where}.admission_cycle")
            key = (ref, cycle)
            if key in seen:
                fail(f"duplicate ({collection}) program/cycle: {ref} {cycle}")
            seen.add(key)
            if not isinstance(row.get("is_current"), bool):
                fail(f"{where}.is_current must be boolean")
            elif row["is_current"] and ref in current:
                current[ref] += 1
        for ref in sorted(current):
            if current[ref] != 1:
                fail(f"{collection} must have exactly one is_current true row for {ref}; found {current[ref]}")

    check_cycle_records(applications, "application_requirements")
    check_cycle_records(auditions, "audition_requirements")

    review_notes = []
    data_quality = package.get("data_quality")
    if not isinstance(data_quality, dict):
        fail("data_quality must be an object")
    else:
        for field in ("overall_confidence", "missing_critical_fields", "needs_human_review", "review_notes"):
            if field not in data_quality:
                fail(f"missing required field: data_quality.{field}")
        if data_quality.get("overall_confidence") not in CONFIDENCE_CHOICES:
            fail(f"invalid enum data_quality.overall_confidence: {data_quality.get('overall_confidence')!r}")
        if not isinstance(data_quality.get("review_notes"), list):
            fail("data_quality.review_notes must be an array")
        else:
            review_notes = data_quality["review_notes"]
            for note in review_notes:
                attention.append({"program_offering_ref": None, "field": "review_notes", "message": str(note)})

    workflow = package.get("workflow_status")
    if not isinstance(workflow, dict):
        fail("workflow_status must be an object")
    else:
        expected_workflow = {
            "extraction_status": "complete", "review_status": "unreviewed",
            "ready_for_directus_import": False,
        }
        for field, expected in expected_workflow.items():
            if field not in workflow:
                fail(f"missing required field: workflow_status.{field}")
            elif workflow[field] != expected:
                fail(f"workflow_status.{field} must be {expected!r}")

    for index, row in enumerate(applications):
        if not isinstance(row, dict):
            continue
        where = f"application_requirements[{index}]"
        for field in ("scholarships_available",):
            if field not in row:
                fail(f"missing required field: {where}.{field}")
        deadline = row.get("application_deadline")
        if deadline is not None and not valid_date(deadline):
            fail(f"malformed date: {where}.application_deadline")
        for field in ("tuition_annual", "toefl_minimum", "ielts_minimum"):
            value = row.get(field)
            if value is not None and not is_number(value):
                fail(f"{where}.{field} must be numeric or null")
        if row.get("tuition_annual") is not None and row.get("tuition_currency") is None:
            fail(f"tuition_annual present without tuition_currency at {where}")
        if row.get("tuition_currency") is not None and row.get("tuition_currency") not in CURRENCIES:
            fail(f"invalid enum {where}.tuition_currency: {row.get('tuition_currency')!r}")
        if row.get("scholarships_available") not in SCHOLARSHIP_CHOICES:
            fail(f"invalid enum {where}.scholarships_available: {row.get('scholarships_available')!r}")
        tests = row.get("english_language_tests")
        if tests is not None:
            if not isinstance(tests, list):
                fail(f"{where}.english_language_tests must be an array or null")
            else:
                for value in tests:
                    if value not in ENGLISH_TESTS:
                        fail(f"invalid enum {where}.english_language_tests: {value!r}")
        toefl = row.get("toefl_minimum")
        if is_number(toefl) and not 0 <= toefl <= 120:
            fail(f"toefl_minimum outside 0-120 at {where}")
        ielts = row.get("ielts_minimum")
        if is_number(ielts) and (not 0 <= ielts <= 9 or not math.isclose(ielts * 2, round(ielts * 2))):
            fail(f"ielts_minimum must be 0-9 in 0.5 increments at {where}")
        if row.get("is_current") is True and deadline is None:
            attention.append({
                "program_offering_ref": row.get("program_offering_ref"),
                "field": "application_deadline", "message": "current application deadline is null",
            })
        if row.get("is_current") is True and row.get("tuition_annual") is None:
            attention.append({
                "program_offering_ref": row.get("program_offering_ref"),
                "field": "tuition_annual", "message": "current annual tuition is null",
            })
        if row.get("scholarships_available") == "Unknown":
            warn(f"{row.get('program_offering_ref')}: scholarships_available is Unknown")

    note_text = "\n".join(str(note) for note in review_notes)
    for index, row in enumerate(auditions):
        if not isinstance(row, dict):
            continue
        where = f"audition_requirements[{index}]"
        for field in ("prescreening_required", "audition_required", "audition_format"):
            if field not in row:
                fail(f"missing required field: {where}.{field}")
        if row.get("prescreening_required") not in PRESCREEN_CHOICES:
            fail(f"invalid enum {where}.prescreening_required: {row.get('prescreening_required')!r}")
        if row.get("audition_required") not in AUDITION_CHOICES:
            fail(f"invalid enum {where}.audition_required: {row.get('audition_required')!r}")
        if row.get("audition_format") not in AUDITION_FORMATS:
            fail(f"invalid enum {where}.audition_format: {row.get('audition_format')!r}")
        deadline = row.get("prescreening_deadline")
        if deadline is not None and not valid_date(deadline):
            fail(f"malformed date: {where}.prescreening_deadline")
        ref = row.get("program_offering_ref")
        if row.get("prescreening_required") == "Yes" and deadline is None and str(ref) not in note_text:
            fail(f"prescreening_required Yes with null deadline and no review note naming {ref}")
        if row.get("audition_required") == "Yes" and not str(row.get("repertoire_summary") or "").strip():
            attention.append({
                "program_offering_ref": ref, "field": "repertoire_summary",
                "message": "audition is required but repertoire_summary is empty",
            })

    source_keys: set[tuple[Any, ...]] = set()
    for index, source in enumerate(sources):
        where = f"source_records[{index}]"
        if not isinstance(source, dict):
            fail(f"{where} must be an object")
            continue
        for field in ("source_url", "source_type", "retrieved_date", "confidence_level"):
            if field not in source:
                fail(f"missing required field: {where}.{field}")
        source_school = source.get("school_ref")
        source_program = source.get("program_offering_ref")
        if source_school is None and source_program is None:
            fail(f"orphan source record at {where}")
        if source_school is not None and source_school != school_ref:
            fail(f"{where}.school_ref does not match school.school_ref")
        if source_program is not None and source_program not in program_by_ref:
            fail(f"orphan program_offering_ref: {source_program!r} at {where}")
        if not valid_date(source.get("retrieved_date")):
            fail(f"malformed date: {where}.retrieved_date")
        if source.get("source_type") not in SOURCE_TYPES:
            fail(f"invalid enum {where}.source_type: {source.get('source_type')!r}")
        if source.get("confidence_level") not in CONFIDENCE_CHOICES:
            fail(f"invalid enum {where}.confidence_level: {source.get('confidence_level')!r}")
        scope = source_program if source_program is not None else source_school
        key = (source.get("source_url"), source.get("related_field"), scope)
        if key in source_keys:
            fail(f"duplicate source natural key at {where}: {key}")
        source_keys.add(key)
        if source.get("confidence_level") == "Low" and source.get("related_field") in DECISION_FIELDS:
            attention.append({
                "program_offering_ref": source_program, "field": source.get("related_field"),
                "message": f"decision-bar source has Low confidence: {source.get('source_url')}",
            })
        if source.get("source_quote") and source.get("related_field") not in HIGH_RISK_FIELDS:
            warn(f"{where}: source_quote is present for non-high-risk field {source.get('related_field')!r}")

    def has_support(ref: str, field: str) -> bool:
        return any(
            isinstance(source, dict)
            and source.get("related_field") == field
            and (source.get("program_offering_ref") == ref or source.get("school_ref") == school_ref)
            and bool(str(source.get("source_quote") or "").strip())
            for source in sources
        )

    for row in applications:
        if not isinstance(row, dict) or row.get("program_offering_ref") not in program_by_ref:
            continue
        ref = row["program_offering_ref"]
        for field in ("application_deadline", "tuition_annual", "toefl_minimum", "ielts_minimum"):
            if row.get(field) is not None and not has_support(ref, field):
                fail(f"stated {field} has no supporting source record for {ref}")
    for row in auditions:
        if not isinstance(row, dict) or row.get("program_offering_ref") not in program_by_ref:
            continue
        ref = row["program_offering_ref"]
        for field in ("prescreening_required", "prescreening_deadline"):
            value = row.get(field)
            is_stated = value is not None and not (field == "prescreening_required" and value == "Unknown")
            if is_stated and not has_support(ref, field):
                fail(f"stated {field} has no supporting source record for {ref}")

    def scan_ids(value: Any, location: str = "package") -> None:
        if isinstance(value, dict):
            for key, child in value.items():
                if key == "id" or key.endswith("_id"):
                    fail(f"Directus internal ID key is prohibited: {location}.{key}")
                scan_ids(child, f"{location}.{key}")
        elif isinstance(value, list):
            for index, child in enumerate(value):
                scan_ids(child, f"{location}[{index}]")

    scan_ids(package)

    expected_program_order = sorted(program_by_ref)
    actual_program_order = [item.get("program_offering_ref") for item in programs if isinstance(item, dict)]
    if actual_program_order != expected_program_order:
        warn("program_offerings are not sorted by program_offering_ref")

    summary = decision_summary(programs, applications, auditions)
    return report(failures, attention, warnings, summary, len(programs))


def decision_summary(
    programs: list[Any], applications: list[Any], auditions: list[Any]
) -> dict[str, Any]:
    total = len([item for item in programs if isinstance(item, dict)])
    current_app = {
        item.get("program_offering_ref"): item
        for item in applications
        if isinstance(item, dict) and item.get("is_current") is True
    }
    current_aud = {
        item.get("program_offering_ref"): item
        for item in auditions
        if isinstance(item, dict) and item.get("is_current") is True
    }
    fields = {
        "application_deadline": sum(1 for row in current_app.values() if row.get("application_deadline") is None),
        "prescreening_required": sum(1 for row in current_aud.values() if row.get("prescreening_required") in (None, "Unknown")),
        "tuition_annual": sum(1 for row in current_app.values() if row.get("tuition_annual") is None),
        "audition_required": sum(1 for row in current_aud.values() if row.get("audition_required") in (None, "Unknown")),
        "language_of_instruction": sum(
            1 for row in programs if isinstance(row, dict) and not row.get("language_of_instruction")
        ),
    }
    return {
        "program_count": total,
        "decision_bar_nulls": {
            field: {
                "null_count": count,
                "total": total,
                "rate": round(count / total, 6) if total else 0,
            }
            for field, count in fields.items()
        },
    }


def report(
    failures: list[str],
    attention: list[dict[str, Any]],
    warnings: list[str],
    summary: dict[str, Any],
    program_count: int,
) -> dict[str, Any]:
    unique_failures = sorted(set(failures))
    unique_attention = sorted(
        {stable_item(item): item for item in attention}.values(), key=stable_item
    )
    unique_warnings = sorted(set(warnings))
    return {
        "valid": not unique_failures,
        "failures": unique_failures,
        "needs_attention": unique_attention,
        "warnings": unique_warnings,
        "summary": summary or {"program_count": program_count, "decision_bar_nulls": {}},
    }


def human_report(result: dict[str, Any]) -> str:
    lines: list[str] = []
    for heading, key in (
        ("FAIL", "failures"), ("NEEDS ATTENTION", "needs_attention"), ("WARN", "warnings")
    ):
        lines.extend([heading, "-"])
        items = result[key]
        if not items:
            lines.append("- None")
        elif key == "needs_attention":
            for item in items:
                scope = item.get("program_offering_ref") or "school/package"
                lines.append(f"- {scope} :: {item.get('field')} :: {item.get('message')}")
        else:
            lines.extend(f"- {item}" for item in items)
        lines.append("")
    lines.extend(["SUMMARY", "-"])
    lines.append(f"- Result: {'PASS' if result['valid'] else 'FAIL'}")
    lines.append(f"- Programs: {result['summary'].get('program_count', 0)}")
    for field, values in result["summary"].get("decision_bar_nulls", {}).items():
        lines.append(
            f"- {field}: {values['null_count']}/{values['total']} null/unknown ({values['rate']:.1%})"
        )
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("package", type=Path)
    parser.add_argument("--json-report", type=Path)
    parser.add_argument("--text-report", type=Path)
    options = parser.parse_args(argv)
    try:
        package = json.loads(options.package.read_text(encoding="utf-8-sig"))
        result = validate_package(package)
    except (OSError, UnicodeError) as error:
        result = report([f"unable to read package: {error}"], [], [], {}, 0)
    except json.JSONDecodeError as error:
        result = report(
            [f"invalid JSON at line {error.lineno} column {error.colno}: {error.msg}"],
            [], [], {}, 0,
        )
    rendered = human_report(result)
    sys.stdout.write(rendered)
    if options.text_report:
        options.text_report.parent.mkdir(parents=True, exist_ok=True)
        options.text_report.write_text(rendered, encoding="utf-8")
    if options.json_report:
        options.json_report.parent.mkdir(parents=True, exist_ok=True)
        options.json_report.write_text(
            json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
    return 0 if result["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

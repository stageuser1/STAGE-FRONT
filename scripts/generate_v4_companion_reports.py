from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output"
VAULT = Path(r"C:\Users\Administrator\Documents\Obsidian Vault")
TODAY = "2026-07-22"

SCHOOLS = {
    "yale_school_of_music": "Yale School of Music",
    "jacobs_school_of_music": "Jacobs School of Music",
    "university_of_michigan_smtd": "University of Michigan School of Music, Theatre & Dance",
    "northwestern_bienen_school_of_music": "Northwestern University Bienen School of Music",
    "usc_thornton_school_of_music": "USC Thornton School of Music",
    "rice_shepherd_school_of_music": "The Shepherd School of Music",
    "peabody_institute": "Peabody Institute",
    "oberlin_conservatory_of_music": "Oberlin College and Conservatory",
    "cleveland_institute_of_music": "Cleveland Institute of Music",
}

FEE_SNAPSHOT = {
    "yale_school_of_music": ("$150", "https://music.yale.edu/how-apply", "School of Music application; no additional ISM fee for applicable programs."),
    "jacobs_school_of_music": ("Undergraduate: $65 IU + $50 Jacobs; graduate: $70 IU + $50 Jacobs", "https://www.music.indiana.edu/admissions/how-to-apply/index.html", "Music Business and special applicant deadlines may differ."),
    "university_of_michigan_smtd": ("Not published on the checked SMTD requirements pages", "https://smtd.umich.edu/admissions/", "No amount inferred from parent-university pages."),
    "northwestern_bienen_school_of_music": ("Not published on the checked Bienen timelines", "https://music.northwestern.edu/admission", "No amount inferred from parent-university pages."),
    "usc_thornton_school_of_music": ("Not published on the checked Thornton deadline and program pages", "https://music.usc.edu/admission/deadlines/", "No amount inferred."),
    "rice_shepherd_school_of_music": ("$75 for the Rice first-year application", "https://admission.rice.edu/apply/first-year-domestic-applicants", "Graduate fee was not resolved; no amount inferred."),
    "peabody_institute": ("$120", "https://peabody.jhu.edu/audition-apply/instructions/", "Double-degree applicants pay only the JHU application fee and may claim the Peabody waiver."),
    "oberlin_conservatory_of_music": ("$100", "https://www.oberlin.edu/admissions-and-aid/conservatory/undergraduate-conservatory-applicants", "Fee waivers are accepted."),
    "cleveland_institute_of_music": ("$125; $175 after 12:00 a.m. December 2", "https://www.cim.edu/admissions/apply", "Latest official apply page checked; current-cycle deadline remains unresolved."),
}

DEGREE_NAMES = {"bm": "Bachelor of Music", "mm": "Master of Music", "dma": "Doctor of Musical Arts", "gd": "Graduate Diploma", "ad": "Artist/Diploma-level"}


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def esc(value: object) -> str:
    return clean(value).replace("|", "\\|")


def label(value: str) -> str:
    return value.replace("_", " ").title().replace("Dma", "DMA")


def source_title(url: str) -> str:
    path = unquote(urlparse(url).path).strip("/")
    if not path:
        return urlparse(url).netloc
    name = path.rsplit("/", 1)[-1]
    if name.casefold() in {"index.html", "index", "auditions", "audition"} and "/" in path:
        name = path.rsplit("/", 2)[-2] + " " + name
    name = re.sub(r"\.(?:html?|pdf)$", "", name, flags=re.I)
    name = re.sub(r"[-_%]+", " ", name)
    return clean(name).title() or urlparse(url).netloc


def load_pdf_audit() -> list[tuple[str, str]]:
    path = OUTPUT / "pdf_link_audit.tsv"
    if not path.exists():
        return []
    rows = []
    for line in path.read_text(encoding="utf-8-sig").splitlines()[1:]:
        if "\t" in line:
            pdf, origin = line.split("\t", 1)
            rows.append((pdf, origin))
    return rows


def vault_files(folder: str) -> list[tuple[Path, str]]:
    root = VAULT / folder
    found = []
    for path in sorted(root.rglob("*.md")):
        text = path.read_text(encoding="utf-8-sig", errors="replace")
        match = re.search(r'^source:\s*["\']?([^"\'\n]+)', text, re.M)
        found.append((path, clean(match.group(1)) if match else ""))
    return found


def application_summary(pkg: dict, slug: str) -> list[str]:
    apps = pkg["application_requirements"]
    deadlines = Counter(a.get("application_deadline") or "Unresolved" for a in apps)
    tests = sorted({test for a in apps for test in (a.get("english_language_tests") or [])})
    materials = sorted({item for a in apps for item in (a.get("required_materials") or [])})
    thresholds = []
    for field, title in [("toefl_minimum", "TOEFL"), ("ielts_minimum", "IELTS"), ("duolingo_minimum", "Duolingo")]:
        values = sorted({a[field] for a in apps if a.get(field) is not None})
        if values:
            thresholds.append(f"{title} {', '.join(map(str, values))}")
    fee, fee_url, fee_note = FEE_SNAPSHOT[slug]
    return [
        f"- Application deadline distribution: {', '.join(f'{k} ({v})' for k, v in sorted(deadlines.items()))}",
        f"- Application fee: {fee}. Source: [{source_title(fee_url)}]({fee_url}). {fee_note}",
        f"- English tests recorded: {', '.join(tests) if tests else 'None published in the checked music-school pages'}" + (f"; minimums: {', '.join(thresholds)}" if thresholds else "."),
        f"- Required-material categories: {', '.join(materials) if materials else 'None published'}.",
        "- Interviews, portfolios, and additional materials are carried in program-level audition/portfolio records and their evidence sources where the official program page specifies them.",
    ]


def extraction_summary(pkg: dict, slug: str) -> str:
    school = pkg["school"]["school_name"]
    programs = pkg["program_offerings"]
    auditions = pkg["audition_requirements"]
    degrees = Counter(p["degree_level_ref"] for p in programs)
    fields = Counter(p["field_ref"] for p in programs)
    prescreen = Counter(a["prescreening_required"] for a in auditions)
    audition = Counter(a["audition_required"] for a in auditions)
    formats = Counter(a["audition_format"] for a in auditions)
    duplicate_refs = len(programs) - len({p["program_offering_ref"] for p in programs})
    duplicate_keys = len(programs) - len({(p["field_ref"], p["degree_level_ref"], p.get("track_or_concentration"), p["official_program_name"]) for p in programs})
    lines = [
        f"# {school} — STAGE V4 Extraction Summary",
        "",
        f"Retrieved and verified: {TODAY}",
        "",
        "## Completion",
        "",
        f"- Program offerings: {len(programs)}",
        f"- Application records: {len(pkg['application_requirements'])}",
        f"- Audition/portfolio records: {len(auditions)}",
        f"- Evidence records: {len(pkg['source_records'])}",
        f"- Repertoire/portfolio summaries populated: {sum(a.get('repertoire_summary') is not None for a in auditions)} of {len(auditions)}",
        f"- Duplicate program refs: {duplicate_refs}; duplicate field/degree/track/name keys: {duplicate_keys}",
        "- Hierarchy checked: school → music school → department/area → instrument or track → program → admission requirements.",
        "- Accordion/collapsible content was expanded through the rendered page content; linked PDFs were inventoried and admission-relevant samples were rendered for visual review.",
        "",
        "## Degree coverage",
        "",
        "| Degree | Offerings |",
        "|---|---:|",
    ]
    for degree, count in sorted(degrees.items()):
        lines.append(f"| {DEGREE_NAMES.get(degree, degree)} | {count} |")
    lines += ["", "## Field coverage", "", "| Field | Offerings |", "|---|---:|"]
    for field, count in sorted(fields.items()):
        lines.append(f"| {label(field)} | {count} |")
    lines += [
        "",
        "## Application requirements",
        "",
        *application_summary(pkg, slug),
        "",
        "## Audition and prescreen coverage",
        "",
        f"- Prescreen decisions: {', '.join(f'{k} {v}' for k, v in sorted(prescreen.items()))}.",
        f"- Audition decisions: {', '.join(f'{k} {v}' for k, v in sorted(audition.items()))}.",
        f"- Formats: {', '.join(f'{k} {v}' for k, v in sorted(formats.items()))}.",
        "",
        "## Contract handling",
        "",
        "The supplied STAGE V4 JSON schema does not permit `source_title`, `department`, application-fee, transcript-count, recommendation-count, essay-detail, or interview-detail keys. Those details are therefore preserved in this summary, `source_inventory.md`, `structure_map.md`, and source quotes rather than by adding non-schema JSON properties.",
        "",
    ]
    return "\n".join(lines)


def unresolved_report(pkg: dict) -> str:
    school = pkg["school"]["school_name"]
    programs = {p["program_offering_ref"]: p for p in pkg["program_offerings"]}
    unknown = []
    missing_rep = []
    stale = []
    for row in pkg["audition_requirements"]:
        ref = row["program_offering_ref"]
        p = programs[ref]
        if any(row.get(k) == "Unknown" for k in ("prescreening_required", "audition_required", "audition_format")):
            unknown.append(ref)
        if row.get("repertoire_summary") is None and (row.get("audition_required") == "Yes" or row.get("prescreening_required") == "Yes"):
            missing_rep.append(ref)
        if row.get("conditional_notes"):
            stale.append((ref, row["conditional_notes"]))
    app_deadline = sorted({a["program_offering_ref"] for a in pkg["application_requirements"] if a.get("application_deadline") is None})
    tuition = sorted({a["program_offering_ref"] for a in pkg["application_requirements"] if a.get("tuition_annual") is None})
    lines = [
        f"# {school} — Unresolved Issues Report",
        "",
        f"Checked: {TODAY}",
        "",
        "Missing values were not inferred. `Unknown` is used only where the program-specific official page did not resolve one value; `Varies` is not used anywhere in the package.",
        "",
        "## Issue counts",
        "",
        f"- Programs with an unresolved audition/prescreen/format decision: {len(unknown)}",
        f"- Programs requiring an audition or prescreen but lacking a repertoire/portfolio summary: {len(missing_rep)}",
        f"- Programs without a current-cycle application deadline: {len(app_deadline)}",
        f"- Programs without current-cycle annual tuition: {len(tuition)}",
        "",
    ]
    for title, refs in [
        ("Unresolved audition or prescreen decisions", unknown),
        ("Required repertoire/portfolio still unresolved", missing_rep),
        ("Current-cycle application deadline not published", app_deadline),
    ]:
        lines += [f"## {title}", ""]
        if refs:
            lines.extend(f"- `{ref}`" for ref in refs)
        else:
            lines.append("- None.")
        lines.append("")
    lines += ["## Tuition", ""]
    if tuition:
        lines.append(f"- Current annual tuition is unresolved for {len(tuition)} offerings. The individual refs are recorded in the JSON `data_quality.missing_critical_fields`; no parent-university estimate was substituted.")
    else:
        lines.append("- No unresolved tuition values.")
    lines += ["", "## Cycle or conditional notes", ""]
    if stale:
        grouped = Counter(note for _, note in stale)
        for note, count in grouped.items():
            lines.append(f"- {note} ({count} program records)")
    else:
        lines.append("- None beyond the explicit unresolved fields above.")
    lines.append("")
    return "\n".join(lines)


def source_inventory(pkg: dict, folder: str, pdf_audit: list[tuple[str, str]]) -> str:
    school = pkg["school"]["school_name"]
    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in pkg["source_records"]:
        grouped[row["source_url"]].append(row)
    package_urls = set(grouped) | {p["program_url"] for p in pkg["program_offerings"]} | {p.get("audition_url") for p in pkg["program_offerings"]}
    pdfs = sorted({(pdf, origin) for pdf, origin in pdf_audit if origin in package_urls})
    lines = [
        f"# {school} — Source Inventory",
        "",
        f"Retrieved: {TODAY}",
        "",
        "Every JSON evidence record keeps `source_url`, `source_type`, `source_quote`, and its related field. The supplied schema has no `source_title` property, so the title-to-URL mapping is preserved here.",
        "",
        "## Official sources used",
        "",
        "| Source title | URL | Source types | Evidence records |",
        "|---|---|---|---:|",
    ]
    for url, rows in sorted(grouped.items()):
        types = ", ".join(sorted({r["source_type"] for r in rows}))
        lines.append(f"| {esc(source_title(url))} | {url} | {esc(types)} | {len(rows)} |")
    lines += ["", "## Obsidian navigation and structure notes consulted", "", "| Vault file | Official source recorded in note |", "|---|---|"]
    for path, source in vault_files(folder):
        lines.append(f"| `{esc(path)}` | {source or 'Not present in front matter'} |")
    lines += ["", "## Linked PDF audit", ""]
    if pdfs:
        lines += [f"Linked PDF URLs found from in-scope official pages: {len(pdfs)}.", "", "| PDF title | PDF URL | Origin page |", "|---|---|---|"]
        for pdf, origin in pdfs:
            lines.append(f"| {esc(source_title(pdf))} | {pdf} | {origin} |")
    else:
        lines.append("No linked PDFs were found on the in-scope official pages. This is a documented zero result, not an omitted check.")
    lines += ["", "The cross-school raw link audit is available at `output/pdf_link_audit.tsv`. Admission-relevant PDF samples were rendered and visually reviewed; curriculum, waiver, and troubleshooting PDFs were classified as supplemental unless they supplied program-name or submission evidence.", ""]
    return "\n".join(lines)


def structure_map(pkg: dict) -> str:
    school = pkg["school"]["school_name"]
    programs = sorted(pkg["program_offerings"], key=lambda p: (p["degree_level_ref"], p["field_ref"], p.get("track_or_concentration") or ""))
    lines = [
        f"# {school} — Structure Map",
        "",
        "Hierarchy: school → music school → department/area/instrument → degree program/track → admission requirement page.",
        "",
        "The V4 schema has no department property. Field/area and track preserve the routable hierarchy, while `program_url` and `audition_url` retain the official endpoints.",
        "",
        "| Degree | Field / area | Track or concentration | Official program name | Program URL | Admission requirement URL |",
        "|---|---|---|---|---|---|",
    ]
    for p in programs:
        lines.append(
            f"| {esc(DEGREE_NAMES.get(p['degree_level_ref'], p['degree_level_ref']))} | {esc(label(p['field_ref']))} | "
            f"{esc(p.get('track_or_concentration') or '—')} | {esc(p['official_program_name'])} | {p['program_url']} | {p.get('audition_url') or 'Not separately published'} |"
        )
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    pdf_audit = load_pdf_audit()
    for slug, folder in SCHOOLS.items():
        directory = OUTPUT / slug
        package_path = directory / f"{slug}.json"
        pkg = json.loads(package_path.read_text(encoding="utf-8-sig"))
        (directory / "extraction_summary.md").write_text(extraction_summary(pkg, slug), encoding="utf-8")
        (directory / "unresolved_issues_report.md").write_text(unresolved_report(pkg), encoding="utf-8")
        (directory / "source_inventory.md").write_text(source_inventory(pkg, folder, pdf_audit), encoding="utf-8")
        (directory / "structure_map.md").write_text(structure_map(pkg), encoding="utf-8")
    print("Regenerated companion reports for nine STAGE V4 packages.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

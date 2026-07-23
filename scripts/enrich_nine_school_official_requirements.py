from __future__ import annotations

import json
import re
import sys
from copy import deepcopy
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup, Tag


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output"
TODAY = "2026-07-22"
CYCLE = "2027-2028"

PACKAGE_PATHS = {
    "yale_school_of_music": OUTPUT / "yale_school_of_music" / "yale_school_of_music.json",
    "jacobs_school_of_music": OUTPUT / "jacobs_school_of_music" / "jacobs_school_of_music.json",
    "university_of_michigan_smtd": OUTPUT / "university_of_michigan_smtd" / "university_of_michigan_smtd.json",
    "northwestern_bienen_school_of_music": OUTPUT / "northwestern_bienen_school_of_music" / "northwestern_bienen_school_of_music.json",
    "usc_thornton_school_of_music": OUTPUT / "usc_thornton_school_of_music" / "usc_thornton_school_of_music.json",
    "rice_shepherd_school_of_music": OUTPUT / "rice_shepherd_school_of_music" / "rice_shepherd_school_of_music.json",
    "peabody_institute": OUTPUT / "peabody_institute" / "peabody_institute.json",
    "oberlin_conservatory_of_music": OUTPUT / "oberlin_conservatory_of_music" / "oberlin_conservatory_of_music.json",
    "cleveland_institute_of_music": OUTPUT / "cleveland_institute_of_music" / "cleveland_institute_of_music.json",
}

VAULT = Path(r"C:\Users\Administrator\Documents\Obsidian Vault")

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "Mozilla/5.0 (compatible; STAGE research extractor/4.0)"})
HTML_CACHE: dict[str, BeautifulSoup] = {}
TEXT_CACHE: dict[str, str] = {}


def norm(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def fetch(url: str) -> BeautifulSoup:
    if url not in HTML_CACHE:
        response = SESSION.get(url, timeout=50)
        response.raise_for_status()
        if "Just a moment" in response.text[:8000]:
            raise RuntimeError(f"anti-bot page returned for {url}")
        HTML_CACHE[url] = BeautifulSoup(response.text, "html.parser")
    return HTML_CACHE[url]


def blocks(container: Tag) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    for el in container.find_all(["h1", "h2", "h3", "h4", "h5", "p", "li"]):
        # Nested list items otherwise repeat the complete descendant list.
        if el.name == "li" and el.find_parent("li") is not None:
            continue
        text = norm(el.get_text(" ", strip=True))
        if text:
            out.append((el.name, text))
    return out


def markdown_blocks(path: Path) -> list[tuple[int, str]]:
    out: list[tuple[int, str]] = []
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = norm(re.sub(r"\[([^]]+)]\([^)]*\)", r"\1", raw))
        if not line or line == "---" or line.startswith(("title:", "source:", "date:", "tags:")):
            continue
        heading = re.match(r"^(#{1,6})\s+(.*)$", line)
        if heading:
            out.append((len(heading.group(1)), norm(heading.group(2))))
        elif re.match(r"^(?:[-*]|\d+[.)])\s+", line):
            out.append((7, re.sub(r"^(?:[-*]|\d+[.)])\s+", "", line)))
        else:
            out.append((8, line))
    return out


def markdown_text_blocks(text: str) -> list[tuple[int, str]]:
    out: list[tuple[int, str]] = []
    for raw in text.splitlines():
        line = norm(re.sub(r"!?(?:\[([^]]*)\])\([^)]*\)", r"\1", raw))
        if not line or line.startswith(("Title:", "URL Source:", "Markdown Content:")):
            continue
        heading = re.match(r"^(#{1,6})\s+(.*)$", line)
        if heading:
            out.append((len(heading.group(1)), norm(heading.group(2)).strip("*")))
        elif re.match(r"^(?:[-*]|\d+[.)])\s+", line):
            out.append((7, re.sub(r"^(?:[-*]|\d+[.)])\s+", "", line).strip("*")))
        elif not line.startswith(("[Image", "Image ")):
            out.append((8, line.strip("*")))
    return out


def official_markdown(url: str) -> str:
    """Read an official page through Jina's text renderer when the origin blocks automation."""
    if url not in TEXT_CACHE:
        response = SESSION.get("https://r.jina.ai/" + url, timeout=120)
        response.raise_for_status()
        if "URL Source:" not in response.text:
            raise RuntimeError(f"text renderer did not return source content for {url}")
        TEXT_CACHE[url] = response.text
    return TEXT_CACHE[url]


def heading_section(entries: list[tuple[int | str, str]], names: Iterable[str], level: int | None = None) -> list[tuple[int | str, str]]:
    wanted = {norm(x).casefold() for x in names}
    start = next(
        (i for i, (kind, value) in enumerate(entries) if value.strip("* ").casefold() in wanted and (level is None or kind == level)),
        None,
    )
    if start is None:
        return []
    start_level = entries[start][0] if isinstance(entries[start][0], int) else int(str(entries[start][0])[1:]) if str(entries[start][0]).startswith("h") else 6
    end = len(entries)
    for i in range(start + 1, len(entries)):
        kind = entries[i][0]
        item_level = kind if isinstance(kind, int) else int(str(kind)[1:]) if str(kind).startswith("h") else 7
        if item_level <= start_level:
            end = i
            break
    return entries[start + 1 : end]


LOGISTICS = re.compile(
    r"(?:upload|file format|application portal|contact|email|audition date|deadline|fee|"
    r"recorded separately|unedited|video should|camera|microphone|accompanist|pianist will|"
    r"schedule|invitation|applicant portal|dropbox|if you are under the age|auditions? will be held|"
    r"video files? should be named)",
    re.I,
)
MUSICAL_HINT = re.compile(
    r"repertoire|movement|concerto|sonata|aria|art song|etude|étude|caprice|excerpt|piece|"
    r"works?|program of|Bach|Mozart|Baroque|Classical|Romantic|Impressionist|memorized music",
    re.I,
)


def musical_lines(items: Iterable[str], limit: int = 18) -> list[str]:
    kept: list[str] = []
    for item in items:
        text = norm(item).strip("-• ")
        if not text or (LOGISTICS.search(text) and not MUSICAL_HINT.search(text)):
            continue
        if len(text) > 520:
            text = text[:517].rstrip() + "..."
        if text not in kept:
            kept.append(text)
        if len(kept) >= limit:
            break
    return kept


def join_summary(prescreen: list[str], audition: list[str], other: list[str] | None = None) -> str | None:
    parts: list[str] = []
    if prescreen:
        parts.append("Prescreen: " + "; ".join(prescreen))
    if audition:
        parts.append("Audition: " + "; ".join(audition))
    if other:
        parts.append("Additional: " + "; ".join(other))
    return " | ".join(parts) or None


def short_quote(*parts: str) -> str:
    text = norm("; ".join(p for p in parts if p))
    punctuation = list(re.finditer(r"[.!?](?:\s|$)", text))
    if len(punctuation) > 2:
        text = text[: punctuation[1].end()].strip().rstrip(".!? ")
    if len(text) <= 390:
        return text
    return text[:390].rsplit(" ", 1)[0]


def source_record(
    pkg: dict,
    *,
    url: str,
    source_type: str,
    related_field: str | None,
    quote: str | None,
    program_ref: str | None = None,
    confidence: str = "High",
) -> dict:
    return {
        "school_ref": None if program_ref else pkg["school"]["school_ref"],
        "program_offering_ref": program_ref,
        "source_url": url,
        "source_type": source_type,
        "retrieved_date": TODAY,
        "source_quote": quote,
        "related_field": related_field,
        "confidence_level": confidence,
    }


def upsert_source(pkg: dict, record: dict) -> None:
    scope = record["program_offering_ref"] or record["school_ref"]
    key = (record["source_url"], record["related_field"], scope)
    for index, existing in enumerate(pkg["source_records"]):
        existing_scope = existing["program_offering_ref"] or existing["school_ref"]
        if (existing["source_url"], existing["related_field"], existing_scope) == key:
            pkg["source_records"][index] = record
            return
    pkg["source_records"].append(record)


def remove_program_audition_sources(pkg: dict, ref: str) -> None:
    audition_fields = {
        "prescreening_required",
        "prescreening_deadline",
        "audition_required",
        "audition_format",
        "repertoire_summary",
    }
    pkg["source_records"] = [
        s
        for s in pkg["source_records"]
        if not (s.get("program_offering_ref") == ref and s.get("related_field") in audition_fields)
    ]


def application_by_ref(pkg: dict) -> dict[str, dict]:
    return {row["program_offering_ref"]: row for row in pkg["application_requirements"]}


def audition_by_ref(pkg: dict) -> dict[str, dict]:
    return {row["program_offering_ref"]: row for row in pkg["audition_requirements"]}


def program_by_ref(pkg: dict) -> dict[str, dict]:
    return {row["program_offering_ref"]: row for row in pkg["program_offerings"]}


def set_deadline(pkg: dict, deadline: str | None, url: str, quote: str) -> None:
    for row in pkg["application_requirements"]:
        row["admission_cycle"] = CYCLE
        row["is_current"] = True
        row["application_deadline"] = deadline
    if deadline:
        upsert_source(
            pkg,
            source_record(
                pkg,
                url=url,
                source_type="Deadline/Fee Page",
                related_field="application_deadline",
                quote=short_quote(quote),
            ),
        )


def set_audition(
    pkg: dict,
    program: dict,
    *,
    url: str,
    prescreen: str,
    audition_required: str,
    audition_format: str,
    prescreen_lines: list[str],
    audition_lines: list[str],
    status_quote: str,
    deadline: str | None = None,
    stale_note: str | None = None,
    confidence: str = "High",
) -> None:
    ref = program["program_offering_ref"]
    row = audition_by_ref(pkg)[ref]
    row.update(
        {
            "admission_cycle": CYCLE,
            "is_current": True,
            "prescreening_required": prescreen,
            "prescreening_deadline": deadline if prescreen == "Yes" else None,
            "audition_required": audition_required,
            "audition_format": audition_format,
            "repertoire_summary": join_summary(prescreen_lines, audition_lines),
            "repertoire_structured": (
                {"prescreen": prescreen_lines, "audition": audition_lines}
                if prescreen_lines or audition_lines
                else None
            ),
            "conditional_notes": stale_note,
            "review_status": "Needs Review" if stale_note or not (prescreen_lines or audition_lines) else "Extracted",
        }
    )
    program["audition_url"] = url
    remove_program_audition_sources(pkg, ref)
    upsert_source(
        pkg,
        source_record(
            pkg,
            url=url,
            source_type="Audition Requirements Page",
            related_field="prescreening_required",
            quote=short_quote(status_quote),
            program_ref=ref,
            confidence=confidence,
        ),
    )
    if prescreen == "Yes" and deadline:
        upsert_source(
            pkg,
            source_record(
                pkg,
                url=url,
                source_type="Audition Requirements Page",
                related_field="prescreening_deadline",
                quote=short_quote(f"Prescreening materials are due {deadline}."),
                program_ref=ref,
                confidence=confidence,
            ),
        )
    upsert_source(
        pkg,
        source_record(
            pkg,
            url=url,
            source_type="Audition Requirements Page",
            related_field="audition_required",
            quote=short_quote(status_quote),
            program_ref=ref,
            confidence=confidence,
        ),
    )
    upsert_source(
        pkg,
        source_record(
            pkg,
            url=url,
            source_type="Audition Requirements Page",
            related_field="audition_format",
            quote=None,
            program_ref=ref,
            confidence=confidence,
        ),
    )
    if row["repertoire_summary"]:
        evidence = short_quote(
            "Prescreen repertoire includes " + "; ".join(prescreen_lines[:2]) if prescreen_lines else "",
            "Audition repertoire includes " + "; ".join(audition_lines[:2]) if audition_lines else "",
        )
        upsert_source(
            pkg,
            source_record(
                pkg,
                url=url,
                source_type="Audition Requirements Page",
                related_field="repertoire_summary",
                quote=evidence,
                program_ref=ref,
                confidence=confidence,
            ),
        )


def section_between(
    entries: list[tuple[str, str]], start: str, ends: set[str], start_level_names: set[str] | None = None
) -> list[tuple[str, str]]:
    found = False
    out: list[tuple[str, str]] = []
    for kind, text in entries:
        if not found:
            if text.casefold() == start.casefold():
                found = True
            continue
        if text.casefold() in {e.casefold() for e in ends} and (not start_level_names or kind in start_level_names):
            break
        out.append((kind, text))
    return out


def split_prescreen_audition(entries: list[tuple[str, str]]) -> tuple[list[str], list[str], str]:
    pre: list[str] = []
    aud: list[str] = []
    mode: str | None = None
    status_bits: list[str] = []
    for kind, text in entries:
        low = text.casefold()
        if "prescreen" in low or "pre-screen" in low or "screening requirements" in low:
            if kind.startswith("h") or low.endswith("requirements") or "required" in low or low.startswith(("prescreening recording", "pre-screening recording")):
                mode = "pre"
                status_bits.append(text)
                continue
        if (
            "final audition" in low
            or "audition requirements" in low
            or "required audition repertoire" in low
            or low.startswith(("live audition", "for audition", "for live audition"))
        ):
            mode = "aud"
            status_bits.append(text)
            continue
        if kind.startswith("h") and any(x in low for x in ["other degrees", "questions about", "faculty"]):
            mode = None
        if mode == "pre" and (kind in {"li", "p"}):
            pre.append(text)
        elif mode == "aud" and (kind in {"li", "p"}):
            aud.append(text)
    return musical_lines(pre), musical_lines(aud), short_quote(*status_bits[:1])


def refresh_data_quality(pkg: dict) -> None:
    programs = program_by_ref(pkg)
    notes = [n for n in pkg["data_quality"].get("review_notes", []) if n.startswith("found, not seeded:")]
    missing: list[str] = []
    for app in pkg["application_requirements"]:
        ref = app["program_offering_ref"]
        if app.get("application_deadline") is None:
            missing.append(f"{ref}.application_deadline")
            notes.append(f"{ref}: application_deadline for {CYCLE} was not published on the official admission page checked on {TODAY}.")
        if app.get("tuition_annual") is None:
            missing.append(f"{ref}.tuition_annual")
            notes.append(f"{ref}: tuition_annual for {CYCLE} was not published on the official tuition page checked on {TODAY}.")
        if app.get("scholarships_available") == "Unknown":
            notes.append(f"{ref}: scholarships_available remains Unknown after checking the official admission and aid pages on {TODAY}.")
    for aud in pkg["audition_requirements"]:
        ref = aud["program_offering_ref"]
        url = programs[ref].get("audition_url") or programs[ref]["program_url"]
        if aud.get("prescreening_required") == "Yes" and aud.get("prescreening_deadline") is None:
            missing.append(f"{ref}.prescreening_deadline")
            notes.append(f"{ref}: prescreening_deadline remains unresolved after checking {url} on {TODAY}.")
        if aud.get("repertoire_summary") is None and (
            aud.get("audition_required") == "Yes" or aud.get("prescreening_required") == "Yes"
        ):
            missing.append(f"{ref}.repertoire_summary")
            notes.append(f"{ref}: repertoire_summary remains unresolved after checking {url} on {TODAY}.")
        if aud.get("audition_format") == "Unknown" and aud.get("audition_required") == "Yes":
            missing.append(f"{ref}.audition_format")
            notes.append(f"{ref}: audition_format remains unresolved after checking {url} on {TODAY}.")
        if aud.get("conditional_notes"):
            notes.append(f"{ref}: {aud['conditional_notes']}")
    pkg["data_quality"].update(
        {
            "overall_confidence": "Medium" if notes else "High",
            "missing_critical_fields": sorted(set(missing)),
            "needs_human_review": bool(notes),
            "review_notes": sorted(set(notes)),
        }
    )


def sort_package(pkg: dict) -> None:
    pkg["program_offerings"].sort(key=lambda x: x["program_offering_ref"])
    pkg["application_requirements"].sort(key=lambda x: (x["program_offering_ref"], x["admission_cycle"]), reverse=False)
    pkg["audition_requirements"].sort(key=lambda x: (x["program_offering_ref"], x["admission_cycle"]), reverse=False)
    pkg["source_records"].sort(
        key=lambda x: (
            1 if x.get("program_offering_ref") else 0,
            x.get("program_offering_ref") or "",
            x["source_url"],
            x.get("related_field") or "",
        )
    )


def save(pkg: dict, path: Path) -> None:
    sort_package(pkg)
    path.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_all() -> dict[str, dict]:
    return {name: json.loads(path.read_text(encoding="utf-8-sig")) for name, path in PACKAGE_PATHS.items()}


def rebuild_matrix(pkg: dict, specs: list[dict]) -> None:
    old_programs = program_by_ref(pkg)
    old_apps = application_by_ref(pkg)
    old_auditions = audition_by_ref(pkg)
    old_by_degree: dict[str, dict] = {}
    for row in pkg["program_offerings"]:
        old_by_degree.setdefault(row["degree_level_ref"], row)

    new_programs: list[dict] = []
    new_apps: list[dict] = []
    new_auditions: list[dict] = []
    keep_refs: set[str] = set()
    school_ref = pkg["school"]["school_ref"]
    for spec in specs:
        degree = spec["degree"]
        track = spec.get("track")
        suffix = f"_{spec['track_slug']}" if spec.get("track_slug") else ""
        ref = f"{school_ref}_{spec['field']}_{degree}{suffix}"
        keep_refs.add(ref)
        template = deepcopy(old_programs.get(ref) or old_by_degree[degree])
        template.update(
            {
                "program_offering_ref": ref,
                "school_ref": school_ref,
                "field_ref": spec["field"],
                "degree_level_ref": degree,
                "track_or_concentration": track,
                "official_program_name": spec["name"],
                "program_url": spec["url"],
                "audition_url": spec["url"],
                "last_checked": TODAY,
                "review_status": "Extracted",
            }
        )
        new_programs.append(template)

        app = deepcopy(old_apps.get(ref) or next(r for r in pkg["application_requirements"] if r["program_offering_ref"] in old_programs and old_programs[r["program_offering_ref"]]["degree_level_ref"] == degree))
        app["program_offering_ref"] = ref
        app["admission_cycle"] = CYCLE
        app["is_current"] = True
        new_apps.append(app)

        aud = deepcopy(old_auditions.get(ref) or next(r for r in pkg["audition_requirements"] if r["program_offering_ref"] in old_programs and old_programs[r["program_offering_ref"]]["degree_level_ref"] == degree))
        aud["program_offering_ref"] = ref
        aud["admission_cycle"] = CYCLE
        aud["is_current"] = True
        new_auditions.append(aud)

    pkg["program_offerings"] = new_programs
    pkg["application_requirements"] = new_apps
    pkg["audition_requirements"] = new_auditions
    pkg["source_records"] = [
        s for s in pkg["source_records"] if s.get("program_offering_ref") is None or s["program_offering_ref"] in keep_refs
    ]


def northwestern_specs() -> list[dict]:
    base = "https://www.music.northwestern.edu/admission/auditions"
    bm = {
        "bass_trombone": ("bass-trombone", "Bachelor of Music: Bass Trombone"),
        "bassoon": ("bassoon", "Bachelor of Music: Bassoon"),
        "cello": ("cello", "Bachelor of Music: Cello"),
        "clarinet": ("clarinet", "Bachelor of Music: Clarinet"),
        "guitar": ("classical-guitar", "Bachelor of Music: Classical Guitar"),
        "double_bass": ("double-bass", "Bachelor of Music: Double Bass"),
        "euphonium": ("euphonium", "Bachelor of Music: Euphonium"),
        "flute": ("flute", "Bachelor of Music: Flute"),
        "harp": ("harp", "Bachelor of Music: Harp"),
        "horn": ("horn", "Bachelor of Music: Horn"),
        "jazz_studies": ("jazz", "Bachelor of Music: Jazz Studies"),
        "composition": ("composition", "Bachelor of Music: Music Composition"),
        "music_education": ("music-education", "Bachelor of Music: Music Education"),
        "musicology": ("musicology", "Bachelor of Music: Musicology"),
        "oboe": ("oboe", "Bachelor of Music: Oboe"),
        "percussion": ("percussion", "Bachelor of Music: Percussion"),
        "piano": ("piano", "Bachelor of Music: Piano Performance"),
        "saxophone": ("saxophone", "Bachelor of Music: Saxophone"),
        "tenor_trombone": ("tenor-trombone", "Bachelor of Music: Tenor Trombone"),
        "trumpet": ("trumpet", "Bachelor of Music: Trumpet"),
        "tuba": ("tuba", "Bachelor of Music: Tuba"),
        "viola": ("viola", "Bachelor of Music: Viola"),
        "violin": ("violin", "Bachelor of Music: Violin"),
        "voice": ("voice", "Bachelor of Music: Voice and Opera Performance"),
    }
    specs = [
        {"field": field, "degree": "bm", "name": name, "url": f"{base}/bm/{slug}"}
        for field, (slug, name) in bm.items()
    ]

    mm = {
        "bass_trombone": ("bass-trombone", "Master of Music: Bass Trombone"),
        "bassoon": ("bassoon", "Master of Music: Bassoon"),
        "cello": ("cello", "Master of Music: Cello"),
        "clarinet": ("clarinet", "Master of Music: Clarinet"),
        "guitar": ("classical-guitar", "Master of Music: Classical Guitar"),
        "collaborative_piano": ("collaborative-piano", "Master of Music: Collaborative Piano"),
        "double_bass": ("double-bass", "Master of Music: Double Bass"),
        "euphonium": ("euphonium", "Master of Music: Euphonium"),
        "flute": ("flute", "Master of Music: Flute"),
        "harp": ("harp", "Master of Music: Harp"),
        "horn": ("horn", "Master of Music: Horn"),
        "jazz_studies": ("jazz", "Master of Music: Jazz Studies"),
        "music_theory": ("music-theory", "Master of Music: Music Theory"),
        "musicology": ("musicology", "Master of Music: Musicology"),
        "oboe": ("oboe", "Master of Music: Oboe"),
        "percussion": ("percussion", "Master of Music: Percussion"),
        "piano": ("piano", "Master of Music: Piano Performance"),
        "saxophone": ("saxophone", "Master of Music: Saxophone"),
        "tenor_trombone": ("tenor-trombone", "Master of Music: Tenor Trombone"),
        "trumpet": ("trumpet", "Master of Music: Trumpet"),
        "tuba": ("tuba", "Master of Music: Tuba"),
        "viola": ("viola", "Master of Music: Viola"),
        "violin": ("violin", "Master of Music: Violin"),
        "voice": ("voice", "Master of Music: Voice and Opera Performance"),
    }
    specs += [
        {"field": field, "degree": "mm", "name": name, "url": f"{base}/mm/{slug}"}
        for field, (slug, name) in mm.items()
    ]
    for field, track in [
        ("choral_conducting", "Choral"),
        ("orchestral_conducting", "Orchestral"),
        ("wind_conducting", "Wind"),
    ]:
        specs.append(
            {
                "field": field,
                "degree": "mm",
                "name": "Master of Music: Conducting (Choral, Orchestral or Wind)",
                "track": track,
                "track_slug": track.lower(),
                "url": f"{base}/mm/conducting",
            }
        )
    specs += [
        {
            "field": "music_education",
            "degree": "mm",
            "name": "Master of Music: Music Education (1 year)",
            "track": "1 year",
            "track_slug": "1_year",
            "url": f"{base}/mm/music-education-1-year",
        },
        {
            "field": "music_education",
            "degree": "mm",
            "name": "Master of Music: Music Education (2-year w/ certification)",
            "track": "2-year w/ certification",
            "track_slug": "2_year_w_certification",
            "url": f"{base}/mm/music-education-2-year",
        },
    ]

    dma_groups = {
        "brass": ["bass_trombone", "euphonium", "horn", "tenor_trombone", "trumpet", "tuba"],
        "strings": ["cello", "double_bass", "guitar", "harp", "viola", "violin"],
        "woodwinds": ["bassoon", "clarinet", "flute", "oboe", "saxophone"],
        "percussion": ["percussion"],
        "piano-performance": ["piano"],
        "voice": ["voice"],
    }
    group_names = {
        "brass": "Doctor of Musical Arts: Brass Performance",
        "strings": "Doctor of Musical Arts: String Performance",
        "woodwinds": "Doctor of Musical Arts: Wind Performance",
        "percussion": "Doctor of Musical Arts: Percussion Performance",
        "piano-performance": "Doctor of Musical Arts in Piano Performance",
        "voice": "Doctor of Musical Arts: Voice and Opera Performance",
    }
    for slug, fields in dma_groups.items():
        for field in fields:
            specs.append(
                {
                    "field": field,
                    "degree": "dma",
                    "name": group_names[slug],
                    "track": field.replace("_", " ").title(),
                    "track_slug": field,
                    "url": f"{base}/dma/{slug}",
                }
            )
    for field, track in [
        ("choral_conducting", "Choral"),
        ("orchestral_conducting", "Orchestral"),
        ("wind_conducting", "Wind"),
    ]:
        specs.append(
            {
                "field": field,
                "degree": "dma",
                "name": "Doctor of Musical Arts: Conducting (Choral, Orchestral and Wind)",
                "track": track,
                "track_slug": track.lower(),
                "url": f"{base}/dma/conducting",
            }
        )
    return specs


def enrich_northwestern(pkg: dict) -> None:
    rebuild_matrix(pkg, northwestern_specs())
    ug_timeline = "https://music.northwestern.edu/admission/undergraduate/application-timeline"
    grad_timeline = "https://music.northwestern.edu/admission/graduate/application-timeline"
    for app in pkg["application_requirements"]:
        degree = program_by_ref(pkg)[app["program_offering_ref"]]["degree_level_ref"]
        app["application_deadline"] = "2026-12-01"
        app["deadline_notes"] = "Regular Decision deadline; Early Decision undergraduate supplement deadline is October 15, 2026."
    upsert_source(
        pkg,
        source_record(
            pkg,
            url=ug_timeline,
            source_type="Deadline/Fee Page",
            related_field="application_deadline",
            quote="Fall 2027 Regular Decision: December 1 - Bienen School Supplement submission deadline.",
        ),
    )
    upsert_source(
        pkg,
        source_record(
            pkg,
            url=grad_timeline,
            source_type="Deadline/Fee Page",
            related_field="application_deadline",
            quote="Fall 2027 Graduate Application and prescreening materials (if applicable) are due December 1.",
        ),
    )
    for program in pkg["program_offerings"]:
        url = program["audition_url"]
        article = fetch(url).find("article")
        if not article:
            raise RuntimeError(f"Northwestern program page has no article: {url}")
        page_blocks = blocks(article)
        pre, aud, status = split_prescreen_audition(page_blocks)
        all_text = norm(article.get_text(" ", strip=True))
        if re.search(r"prescreening (?:is )?not required|no prescreen", all_text, re.I):
            prescreen = "No"
            pre = []
        elif re.search(r"prescreening required", all_text, re.I):
            prescreen = "Yes"
        else:
            prescreen = "No"
            pre = []
        audition_required = "Yes" if re.search(r"final audition|audition dates?", all_text, re.I) else "No"
        if audition_required == "No":
            aud = musical_lines(
                [text for kind, text in page_blocks if kind in {"p", "li"} and re.search(r"portfolio|interview|writing sample", text, re.I)]
            )
        if re.search(r"recorded audition", all_text, re.I) and re.search(r"live|on-campus", all_text, re.I):
            fmt = "Live or Recorded"
        elif audition_required == "Yes":
            fmt = "Live Only"
        else:
            fmt = "Unknown"
        if audition_required == "Yes" and not aud:
            aud = musical_lines([text for kind, text in page_blocks if kind in {"p", "li"}], 24)
        upsert_source(
            pkg,
            source_record(
                pkg,
                url=url,
                source_type="Official Program Page",
                related_field="official_program_name",
                quote=short_quote(program["official_program_name"]),
                program_ref=program["program_offering_ref"],
            ),
        )
        set_audition(
            pkg,
            program,
            url=url,
            prescreen=prescreen,
            audition_required=audition_required,
            audition_format=fmt,
            prescreen_lines=pre,
            audition_lines=aud,
            status_quote=status or short_quote(page_blocks[1][1], page_blocks[2][1] if len(page_blocks) > 2 else ""),
            deadline="2026-12-01" if prescreen == "Yes" else None,
        )


def yale_area_entries(all_blocks: list[tuple[str, str]], field: str, degree: str) -> list[tuple[str, str]]:
    top_order = [
        "Brass",
        "Composition",
        "Conducting",
        "Guitar",
        "Harp",
        "Harpsichord",
        "Organ",
        "Percussion",
        "Piano",
        "Strings",
        "Voice",
        "Woodwinds",
        "String Quartet Fellowship",
        "How to make a Prescreening Video",
    ]
    top_for_field = {
        "horn": "Brass",
        "trumpet": "Brass",
        "tenor_trombone": "Brass",
        "tuba": "Brass",
        "composition": "Composition",
        "orchestral_conducting": "Conducting",
        "choral_conducting": "Conducting",
        "guitar": "Guitar",
        "harp": "Harp",
        "organ": "Organ",
        "percussion": "Percussion",
        "piano": "Piano",
        "violin": "Strings",
        "viola": "Strings",
        "cello": "Strings",
        "double_bass": "Strings",
        "voice": "Voice",
        "flute": "Woodwinds",
        "oboe": "Woodwinds",
        "clarinet": "Woodwinds",
        "bassoon": "Woodwinds",
    }
    start = top_for_field[field]
    start_index = next(i for i, (_, text) in enumerate(all_blocks) if text == start)
    following = set(top_order[top_order.index(start) + 1 :])
    end_index = next((i for i in range(start_index + 1, len(all_blocks)) if all_blocks[i][1] in following), len(all_blocks))
    section = all_blocks[start_index + 1 : end_index]

    sub_for_field = {
        "orchestral_conducting": "Orchestral Conducting",
        "choral_conducting": "Choral Conducting",
        "violin": "Violin",
        "viola": "Viola",
        "cello": "Cello",
        "double_bass": "Double Bass",
        "flute": "Flute",
        "oboe": "Oboe",
        "clarinet": "Clarinet",
        "bassoon": "Bassoon",
    }
    if field in sub_for_field:
        sub = sub_for_field[field]
        sub_start = next(i for i, (_, text) in enumerate(section) if text == sub)
        peer_names = set(sub_for_field.values())
        sub_end = next(
            (i for i in range(sub_start + 1, len(section)) if section[i][1] in peer_names),
            len(section),
        )
        section = section[sub_start + 1 : sub_end]
    if field == "guitar":
        target = "For M.M., M.M.A., and Certificate applicants" if degree == "mm" else "For A.D. and D.M.A. applicants"
        target_index = next(i for i, (_, text) in enumerate(section) if text == target)
        other = {"For M.M., M.M.A., and Certificate applicants", "For A.D. and D.M.A. applicants"}
        target_end = next(
            (i for i in range(target_index + 1, len(section)) if section[i][1] in other),
            len(section),
        )
        section = section[target_index + 1 : target_end]
    return section


def enrich_yale(pkg: dict) -> None:
    url = "https://music.yale.edu/how-apply"
    main = fetch(url).find("main")
    if not main:
        raise RuntimeError("Yale How to Apply page has no main element")
    page_blocks = blocks(main)
    set_deadline(pkg, "2026-12-01", url, "A completed online application is due by December 1 each year.")
    upsert_source(
        pkg,
        source_record(
            pkg,
            url="https://music.yale.edu/sites/default/files/2020-09/make%20a%20prescreening%20video_0.pdf",
            source_type="Audition Requirements Page",
            related_field="audition_format",
            quote="How to make a Prescreening Video: select a recording device and room, position the camera, test, record, and upload the recording.",
        ),
    )
    for app in pkg["application_requirements"]:
        app["deadline_notes"] = None
        materials = set(app.get("required_materials") or [])
        materials.update({"Online application", "Recommendation letters", "Résumé/CV", "Transcripts", "Prescreen materials"})
        app["required_materials"] = sorted(materials)
    for program in pkg["program_offerings"]:
        section = yale_area_entries(page_blocks, program["field_ref"], program["degree_level_ref"])
        pre, aud, status = split_prescreen_audition(section)
        # Composition is evaluated through scores/recordings and interview, not a performance audition.
        if program["field_ref"] == "composition":
            audition_required = "No"
            fmt = "Unknown"
            if not pre:
                pre = musical_lines([text for kind, text in section if kind in {"p", "li"}])
            audition_lines = []
            app = application_by_ref(pkg)[program["program_offering_ref"]]
            app["required_materials"] = sorted(set(app["required_materials"] + ["Portfolio", "Interview"]))
        else:
            audition_required = "Yes"
            fmt = "Live Only"
            audition_lines = aud
            fallback = degree_repertoire(section, program["degree_level_ref"])
            if not pre:
                pre = fallback
            if not audition_lines:
                audition_lines = fallback
        set_audition(
            pkg,
            program,
            url=url,
            prescreen="Yes",
            audition_required=audition_required,
            audition_format=fmt,
            prescreen_lines=pre,
            audition_lines=audition_lines,
            status_quote=status or "All applicants should submit prescreening recordings; in-person live auditions are held for applicants who pass prescreening.",
            deadline="2026-12-01",
        )


CIM_PANEL = {
    "bassoon": "panel-bassoon",
    "cello": "panel-cello-",
    "clarinet": "panel-clarinet",
    "collaborative_piano": "panel-collaborative-piano",
    "composition": "panel-composition",
    "double_bass": "panel-double-bass",
    "flute": "panel-flute",
    "guitar": "panel-guitar-classical",
    "harp": "panel-harp",
    "horn": "panel-horn",
    "oboe": "panel-oboe",
    "organ": "panel-organ",
    "piano": "panel-piano",
    "percussion": "panel-timpani-and-percussion",
    "bass_trombone": "panel-trombone-and-bass-trombone",
    "tenor_trombone": "panel-trombone-and-bass-trombone",
    "trumpet": "panel-trumpet",
    "tuba": "panel-tuba",
    "viola": "panel-viola",
    "violin": "panel-violin-",
    "voice": "panel-voice",
}


def cim_degree_audition_lines(entries: list[tuple[str, str]], degree: str) -> list[str]:
    start = next((i for i, (_, text) in enumerate(entries) if text.casefold() == "audition requirements"), None)
    if start is None:
        return []
    tail = entries[start + 1 :]
    marker_re = re.compile(
        r"^(?:undergraduate|graduate|master of music|artist diploma|doctor of|all applicants|"
        r"bachelor of music|artist certificate)",
        re.I,
    )
    markers = [(i, text) for i, (_, text) in enumerate(tail) if marker_re.search(text)]
    wanted: list[str]
    if degree == "bm":
        wanted = ["undergraduate", "bachelor of music", "all applicants"]
    elif degree in {"mm", "gd"}:
        wanted = ["master of music", "graduate", "all applicants"]
    elif degree == "ad":
        wanted = ["artist diploma", "master of music", "graduate", "all applicants"]
    else:
        wanted = ["doctor of", "artist diploma and doctor", "all applicants"]
    chosen = next((item for item in markers if any(item[1].casefold().startswith(w) for w in wanted)), None)
    if chosen:
        begin = chosen[0] + 1
        end = next((i for i, _ in markers if i > chosen[0]), len(tail))
        selected = tail[begin:end]
    else:
        selected = tail
    return musical_lines(
        [text for kind, text in selected if kind in {"p", "li", "h3", "h4"} and not text.casefold().startswith("resource for")],
        limit=24,
    )


def enrich_cleveland(pkg: dict) -> None:
    url = "https://www.cim.edu/admissions/audition/repertoire"
    soup = fetch(url)
    for program in pkg["program_offerings"]:
        field = program["field_ref"]
        if field not in CIM_PANEL:
            continue
        panel = soup.find(id=CIM_PANEL[field])
        if not panel:
            raise RuntimeError(f"Missing CIM accordion panel for {field}")
        entries = blocks(panel)
        text = norm(panel.get_text(" ", strip=True))
        first_status = next(
            (line for _, line in entries if re.search(r"prescreening (?:video|recording|is)", line, re.I)),
            "Find prescreening and audition repertoire requirements below for the specific area of study.",
        )
        degree = program["degree_level_ref"]
        if re.search(r"not required, except for doctor of musical arts and artist diploma", text, re.I):
            prescreen = "Yes" if degree in {"dma", "ad"} else "No"
        elif re.search(r"required for graduate applicants", text, re.I):
            prescreen = "No" if degree == "bm" else "Yes"
        elif re.search(r"prescreening (?:video|recording|is) (?:is )?required", text, re.I):
            prescreen = "Yes"
        elif re.search(r"prescreening recording is not required", text, re.I):
            prescreen = "No"
        else:
            prescreen = "Unknown"
        audition_index = next((i for i, (_, line) in enumerate(entries) if line.casefold() == "audition requirements"), len(entries))
        pre = musical_lines([line for kind, line in entries[:audition_index] if kind in {"p", "li"}]) if prescreen == "Yes" else []
        aud = cim_degree_audition_lines(entries, degree)
        set_audition(
            pkg,
            program,
            url=url,
            prescreen=prescreen,
            audition_required="No" if field == "composition" else "Yes",
            audition_format="Unknown" if field == "composition" else "Live Only",
            prescreen_lines=pre,
            audition_lines=aud,
            status_quote=first_status,
            deadline=None,
        )


def degree_repertoire(entries: list[tuple[str | int, str]], degree: str) -> list[str]:
    degree_patterns = {
        "bm": r"undergraduate|bachelor of music|\bBM\b|\bB\.M\.",
        "mm": r"master(?:'s)? of music|graduate.*MM|\bMM\b|\bM\.M\.",
        "dma": r"doctor of musical arts|\bDMA\b|\bD\.M\.A\.",
        "ad": r"artist diploma|\bAD\b|\bA\.D\.",
        "gd": r"graduate performance diploma|graduate diploma|\bGPD\b|\bGD\b",
    }
    pattern = re.compile(degree_patterns[degree], re.I)
    candidates: list[tuple[int, int]] = []
    for i, (kind, value) in enumerate(entries):
        is_heading = (isinstance(kind, int) and kind <= 6) or str(kind).startswith("h")
        if is_heading and pattern.search(value):
            level = kind if isinstance(kind, int) else int(str(kind)[1:])
            candidates.append((i, level))
    if candidates:
        start, level = candidates[-1] if degree in {"dma", "ad"} else candidates[0]
        end = len(entries)
        for i in range(start + 1, len(entries)):
            kind = entries[i][0]
            item_level = kind if isinstance(kind, int) else int(str(kind)[1:]) if str(kind).startswith("h") else 7
            if item_level <= level:
                end = i
                break
        picked = [value for kind, value in entries[start + 1 : end] if kind in {7, 8, "p", "li"}]
        if picked:
            return musical_lines(picked, 24)
    return musical_lines([value for kind, value in entries if kind in {7, 8, "p", "li"}], 24)


RICE_FIELD_LABELS = {
    "Music History": "music_history",
    "Piano Chamber Music and Accompanying": "collaborative_piano",
    "String Quartet": "professional_string_quartet",
    "Trombone": "tenor_trombone",
    "Opera": "opera_studies",
    "Voice": "voice",
}


def rice_link_map() -> dict[tuple[str, str], str]:
    found: dict[tuple[str, str], str] = {}
    root = VAULT / "The Shepherd School of Music" / "admission" / "general" / "Auditions"
    for path in root.rglob("*.md"):
        for label, url in re.findall(r"\[([^]]+)\]\((https://music\.rice\.edu/[^)]+)\)", path.read_text(encoding="utf-8-sig")):
            clean = label.replace("\\*", "").strip()
            field = RICE_FIELD_LABELS.get(clean, clean.casefold().replace(" ", "_").replace("_performance", ""))
            if "bachelor-music" in url:
                degree = "bm"
            elif "master-music" in url:
                degree = "mm"
            elif "artist-diploma" in url:
                degree = "ad"
            elif "doctor-musical-arts" in url:
                degree = "dma"
            else:
                continue
            found[(degree, field)] = url
    return found


def enrich_rice(pkg: dict) -> None:
    links = rice_link_map()
    stale = (
        "The latest official instrument page available on 2026-07-22 is labeled Fall 2026 and cites a "
        "December 1, 2025 preliminary deadline; it is retained as the latest published repertoire but not treated as a current-cycle deadline."
    )
    for app in pkg["application_requirements"]:
        app["application_deadline"] = None
        app["deadline_notes"] = stale
    for program in pkg["program_offerings"]:
        key = (program["degree_level_ref"], program["field_ref"])
        url = links.get(key)
        if not url:
            continue
        main = fetch(url).find("main")
        if not main:
            continue
        entries = blocks(main)
        req = section_between(entries, "Audition Requirements", {"Questions about your application?"})
        pre, aud, status = split_prescreen_audition(req)
        text_value = norm(main.get_text(" ", strip=True))
        prescreen = "Yes" if re.search(r"preliminary|prescreen", text_value, re.I) else "No"
        nonperformance = program["field_ref"] in {"composition", "music_history", "musicology"}
        if not pre and prescreen == "Yes":
            prelim_i = next((i for i, (_, t) in enumerate(req) if re.search(r"preliminary", t, re.I)), None)
            audition_i = next((i for i, (_, t) in enumerate(req) if re.search(r"required audition", t, re.I)), len(req))
            if prelim_i is not None:
                pre = musical_lines([t for k, t in req[prelim_i + 1 : audition_i] if k in {"p", "li"}])
        if not aud:
            audition_i = next((i for i, (_, t) in enumerate(req) if re.search(r"required audition|interview", t, re.I)), None)
            if audition_i is not None:
                aud = musical_lines([t for k, t in req[audition_i + 1 :] if k in {"p", "li"}])
        selected = degree_repertoire(req, program["degree_level_ref"])
        if prescreen == "Yes" and not pre:
            pre = selected
        if not aud:
            aud = selected
        set_audition(
            pkg,
            program,
            url=url,
            prescreen=prescreen,
            audition_required="No" if nonperformance else "Yes",
            audition_format="Unknown" if nonperformance else "Live Only",
            prescreen_lines=pre,
            audition_lines=[] if nonperformance else aud,
            status_quote=status or "The official program page publishes preliminary and audition requirements.",
            deadline=None,
            stale_note=stale,
            confidence="Medium",
        )
        program["program_url"] = url

    for program in pkg["program_offerings"]:
        if program["field_ref"] != "professional_string_quartet":
            continue
        upsert_source(
            pkg,
            source_record(
                pkg,
                url="https://music.rice.edu/sites/default/files/2020-11/String_Quartet_%20Supplement.pdf",
                source_type="Application Requirements Page",
                related_field="required_materials",
                quote="Graduate String Quartet Supplement: preliminary submissions must accompany one completed Rice application including the Shepherd School String Quartet Supplement.",
                program_ref=program["program_offering_ref"],
                confidence="Medium",
            ),
        )


def _add_usc_pdf_evidence(pkg: dict) -> None:
    for program in pkg["program_offerings"]:
        if program["field_ref"] != "collaborative_piano":
            continue
        upsert_source(
            pkg,
            source_record(
                pkg,
                url="https://music.usc.edu/files/2021/07/KCA-List-of-Suggested-Repertoire-by-BIPOC-and-other-marginalized-composers.pdf",
                source_type="Audition Requirements Page",
                related_field="repertoire_summary",
                quote="Suggested Collaborative Repertoire by BIPOC Composers, Women, and Selected Other Marginalized Groups of Composers.",
                program_ref=program["program_offering_ref"],
            ),
        )


JACOBS_PAGE = {
    "bassoon": "woodwinds", "clarinet": "woodwinds", "flute": "woodwinds", "oboe": "woodwinds", "saxophone": "woodwinds",
    "horn": "brass", "trumpet": "brass", "tenor_trombone": "brass", "tuba": "brass",
    "violin": "strings", "viola": "strings", "cello": "strings", "double_bass": "strings",
    "composition": "composition", "choral_conducting": "choral-conducting", "collaborative_piano": "collaborative-piano",
    "guitar": "guitar", "harp": "harp", "jazz_studies": "jazz-studies", "music_education": "music-education",
    "orchestral_conducting": "orchestral-conducting", "organ": "organ", "percussion": "percussion", "piano": "piano",
    "voice": "voice", "wind_conducting": "wind-conducting",
}


def enrich_jacobs(pkg: dict) -> None:
    deadline_url = "https://www.music.indiana.edu/admissions/how-to-apply/index.html"
    set_deadline(pkg, "2026-12-01", deadline_url, "December 1: Jacobs Supplemental application, prescreening when applicable, and IU graduate application are due.")
    group_fields = {"strings", "woodwinds", "brass"}
    aliases = {"tenor_trombone": "Trombone", "horn": "Horn", "double_bass": "Double Bass"}
    for program in pkg["program_offerings"]:
        slug = JACOBS_PAGE.get(program["field_ref"])
        if not slug:
            continue
        url = f"https://www.music.indiana.edu/admissions/auditions/{slug}.html"
        main = fetch(url).find("main") or fetch(url).find("article")
        if not main:
            continue
        entries = blocks(main)
        if slug in group_fields:
            name = aliases.get(program["field_ref"], program["field_ref"].replace("_", " ").title())
            section = heading_section(entries, [name])
        else:
            section = entries
        all_text = norm(" ".join(v for _, v in section))
        prescreen = "Yes" if re.search(r"must submit pre.?screen|prescreen(?:ing)? (?:recordings? )?(?:is |are )?required", all_text, re.I) else "No"
        pre, aud, status = split_prescreen_audition(section)
        selected = degree_repertoire(section, program["degree_level_ref"])
        if not aud:
            aud = selected
        if prescreen == "Yes" and not pre:
            pre = selected
        nonperformance = program["field_ref"] in {"composition", "music_education"}
        set_audition(
            pkg, program, url=url, prescreen=prescreen,
            audition_required="No" if nonperformance else "Yes",
            audition_format="Unknown" if nonperformance else "Live or Recorded",
            prescreen_lines=pre,
            audition_lines=[] if nonperformance else aud,
            status_quote=status or "Applicants complete the department audition or interview requirements; final recorded auditions are permitted when a live weekend cannot be attended.",
            deadline="2026-12-01" if prescreen == "Yes" else None,
        )
        program["program_url"] = url
        if program["field_ref"] == "voice":
            upsert_source(
                pkg,
                source_record(
                    pkg,
                    url="https://www.music.indiana.edu/doc/admissions/voice/star-vicino-bb.pdf",
                    source_type="Audition Requirements Page",
                    related_field="repertoire_summary",
                    quote="STAR VICINO, Arietta, by Salvator Rosa, in B-flat.",
                    program_ref=program["program_offering_ref"],
                ),
            )


OBERLIN_CATEGORY = {
    "violin": "strings", "viola": "strings", "cello": "strings", "double_bass": "strings", "harp": "strings", "guitar": "strings",
    "bassoon": "winds-brass-and-percussion", "clarinet": "winds-brass-and-percussion", "flute": "winds-brass-and-percussion",
    "horn": "winds-brass-and-percussion", "oboe": "winds-brass-and-percussion", "percussion": "winds-brass-and-percussion",
    "saxophone": "winds-brass-and-percussion", "tenor_trombone": "winds-brass-and-percussion", "trumpet": "winds-brass-and-percussion", "tuba": "winds-brass-and-percussion",
    "piano": "keyboard", "collaborative_piano": "keyboard", "organ": "keyboard", "harpsichord": "keyboard", "voice": "voice", "early_music": "historical-performance",
    "jazz_performance": "jazz-studies", "jazz_studies": "jazz-studies", "composition": "contemporary-music-division",
    "music_creation_technology": "contemporary-music-division",
}


def enrich_oberlin(pkg: dict) -> None:
    deadline_url = "https://www.oberlin.edu/admissions-and-aid/conservatory/undergraduate-conservatory-applicants"
    set_deadline(pkg, "2026-12-01", deadline_url, "Regular Decision Common Application deadline: December 1; screening materials deadline: December 4.")
    aliases = {"guitar": "Classical Guitar", "tenor_trombone": "Trombone", "early_music": "Historical Performance", "jazz_studies": "Jazz Composition", "music_creation_technology": "TIMARA"}
    for program in pkg["program_offerings"]:
        category = OBERLIN_CATEGORY.get(program["field_ref"])
        if not category:
            continue
        url = f"https://www.oberlin.edu/admissions-and-aid/conservatory/auditions-and-interviews/{category}"
        main = fetch(url).find("main")
        if not main:
            continue
        entries = blocks(main)
        name = aliases.get(program["field_ref"], program["field_ref"].replace("_", " ").title())
        section = heading_section(entries, [name]) or entries
        pre, aud, status = split_prescreen_audition(section)
        text_value = norm(" ".join(v for _, v in section))
        prescreen = "Yes" if re.search(r"screening requirements", text_value, re.I) else "No"
        nonperformance = program["field_ref"] in {"composition", "music_creation_technology", "musicology"}
        selected = degree_repertoire(section, program["degree_level_ref"])
        if prescreen == "Yes" and not pre:
            pre = selected
        if not aud:
            aud = selected
        set_audition(
            pkg, program, url=url, prescreen=prescreen,
            audition_required="No" if nonperformance else "Yes",
            audition_format="Unknown" if nonperformance else "Live or Recorded",
            prescreen_lines=pre,
            audition_lines=[] if nonperformance else aud,
            status_quote=status or "The official area page publishes screening and final audition requirements.",
            deadline="2026-12-04" if prescreen == "Yes" else None,
        )
        program["program_url"] = url


USC_PAGE = {
    "bassoon": "woodwinds-and-brass", "clarinet": "woodwinds-and-brass", "flute": "woodwinds-and-brass", "horn": "woodwinds-and-brass",
    "oboe": "woodwinds-and-brass", "saxophone": "woodwinds-and-brass", "tenor_trombone": "woodwinds-and-brass", "trumpet": "woodwinds-and-brass", "tuba": "woodwinds-and-brass",
    "cello": "strings", "double_bass": "strings", "harp": "strings", "viola": "strings", "violin": "strings",
    "composition": "composition", "choral_conducting": "choral-and-sacred-music", "collaborative_piano": "keyboard-collaborative-arts",
    "contemporary_media_film_composition": "screen-scoring", "guitar": "classical-guitar", "jazz_studies": "jazz-studies",
    "music_education": "music-teaching-and-learning", "organ": "organ-studies", "percussion": "percussion", "piano": "keyboard-studies",
    "voice": "vocal-arts",
}


def usc_instrument_parts(entries: list[tuple[str, str]], names: list[str]) -> tuple[list[str], list[str]]:
    occurrences = [i for i, (k, v) in enumerate(entries) if k in {"h4", "h5"} and v.casefold() in {n.casefold() for n in names}]
    pre: list[str] = []
    aud: list[str] = []
    for index in occurrences:
        end = next((j for j in range(index + 1, len(entries)) if entries[j][0] in {"h1", "h2", "h3", "h4"}), len(entries))
        segment = musical_lines([v for k, v in entries[index + 1 : end] if k in {"p", "li"}], 24)
        prefix = " ".join(v for _, v in entries[max(0, index - 15) : index]).casefold()
        if "perform audition" in prefix or "live audition" in prefix:
            aud.extend(x for x in segment if x not in aud)
        else:
            pre.extend(x for x in segment if x not in pre)
    return pre, aud


def enrich_usc(pkg: dict) -> None:
    deadline_url = "https://music.usc.edu/admission/deadlines/"
    set_deadline(pkg, "2026-12-01", deadline_url, "Fall undergraduate and graduate Thornton applications and required portfolio materials are due December 1.")
    aliases = {"horn": ["French Horn", "Horn"], "tenor_trombone": ["Trombone"], "double_bass": ["Double Bass"], "voice": ["Voice"]}
    for program in pkg["program_offerings"]:
        base = USC_PAGE.get(program["field_ref"])
        if not base:
            continue
        degree = program["degree_level_ref"]
        suffix = "undergraduate" if degree == "bm" else "graduate"
        url = f"https://music.usc.edu/admission/appreqs/{base}-{suffix}/"
        try:
            main = fetch(url).find("main") or fetch(url).find("article") or fetch(url).select_one("section.page-content")
        except requests.HTTPError:
            continue
        if not main:
            continue
        entries = blocks(main)
        names = aliases.get(program["field_ref"], [program["field_ref"].replace("_", " ").title()])
        pre, aud = usc_instrument_parts(entries, names)
        page_text = norm(main.get_text(" ", strip=True))
        prescreen = "Yes" if re.search(r"prescreen recorded audition|pre.?screen", page_text, re.I) else "No"
        if not (pre or aud):
            selected = degree_repertoire(entries, degree)
            pre2, aud2, _ = split_prescreen_audition(entries)
            pre, aud = pre2, aud2 or selected
        nonperformance = program["field_ref"] in {"composition", "music_education", "contemporary_media_film_composition"}
        if prescreen == "Yes" and not pre:
            pre = degree_repertoire(entries, degree)
        set_audition(
            pkg, program, url=url, prescreen=prescreen,
            audition_required="No" if nonperformance else "Yes",
            audition_format="Unknown" if nonperformance else "Live Only",
            prescreen_lines=pre,
            audition_lines=[] if nonperformance else aud,
            status_quote="The official application-requirements page specifies the SlideRoom prescreen and invited live audition process.",
            deadline="2026-12-01" if prescreen == "Yes" else None,
        )
        program["program_url"] = url


    _add_usc_pdf_evidence(pkg)


MICH_UG_URL = "https://smtd.umich.edu/admissions/undergraduate/requirements-for-pre-screening-portfolios-auditions-interviews/"
MICH_GRAD_URL = "https://smtd.umich.edu/admissions/graduate/auditions-interviews/"


def michigan_section(entries: list[tuple[int, str]], program: dict) -> list[tuple[int, str]]:
    field = program["field_ref"]
    degree = program["degree_level_ref"]
    name = {"tenor_trombone": "Trombone", "jazz_studies": "Jazz & Contemporary Improvisation", "collaborative_piano": "Collaborative Piano", "choral_conducting": "Conducting: Choral", "orchestral_conducting": "Conducting: Orchestral", "wind_conducting": "Conducting: Band/Wind Ensemble"}.get(field, field.replace("_", " ").title())
    if degree != "bm" and field in {"early_music", "organ", "harpsichord"}:
        name = "Organ, Carillon, and Harpsichord"
    if degree != "bm" and field == "piano":
        name = "Piano Performance"
    if degree != "bm" and field == "voice":
        name = "Voice DMA" if degree == "dma" else "Voice MM & SM"
    if degree != "bm" and field in {"cello", "double_bass", "harp", "viola", "violin"}:
        name = "Strings & Harp DMA" if degree == "dma" else "Strings & Harp MM & SM"
    if degree != "bm" and field in {"bassoon", "clarinet", "flute", "horn", "oboe", "saxophone", "tenor_trombone", "trumpet", "tuba"}:
        name = "Winds & Brass DMA" if degree == "dma" else "Winds & Brass MM & SM"
    return heading_section(entries, [name])


def enrich_michigan(pkg: dict) -> None:
    ug_entries = markdown_text_blocks(official_markdown(MICH_UG_URL))
    grad_entries = markdown_text_blocks(official_markdown(MICH_GRAD_URL))
    # Michigan's pages are current for Fall 2027, but the application deadline is stated on a separate admissions page.
    set_deadline(pkg, "2026-12-01", MICH_GRAD_URL, "Fall 2027 artistic profiles, prescreens, portfolios, and graduate materials are due December 1 unless a program states otherwise.")
    for program in pkg["program_offerings"]:
        entries = ug_entries if program["degree_level_ref"] == "bm" else grad_entries
        url = MICH_UG_URL if program["degree_level_ref"] == "bm" else MICH_GRAD_URL
        section = michigan_section(entries, program)
        if not section:
            continue
        pre, aud, status = split_prescreen_audition([(f"h{k}" if isinstance(k, int) and k <= 6 else "li" if k == 7 else "p", v) for k, v in section])
        chosen = degree_repertoire(section, program["degree_level_ref"])
        text_value = norm(" ".join(v for _, v in section))
        prescreen = "Yes" if re.search(r"pre.?screen|video requirements|portfolio requirements", text_value, re.I) else "No"
        nonperformance = program["field_ref"] in {"composition", "music_theory", "musicology", "music_education"}
        if not pre and prescreen == "Yes": pre = chosen
        if not aud: aud = chosen
        fmt = "Live or Recorded" if re.search(r"online|recorded", text_value, re.I) else "Live Only"
        set_audition(
            pkg, program, url=url, prescreen=prescreen,
            audition_required="No" if nonperformance else "Yes",
            audition_format="Unknown" if nonperformance else fmt,
            prescreen_lines=pre,
            audition_lines=[] if nonperformance else aud,
            status_quote=status or "The official Fall 2027 requirements page specifies the program's prescreen, portfolio, audition, or interview process.",
            deadline="2026-12-01" if prescreen == "Yes" else None,
        )
        program["program_url"] = url


PEABODY_FIELD = {
    "bassoon": "Bassoon", "cello": "Cello", "clarinet": "Clarinet", "composition": "Composition", "double_bass": "Double Bass",
    "euphonium": "Euphonium", "flute": "Flute", "guitar": "Guitar", "harp": "Harp", "horn": "Horn", "oboe": "Oboe",
    "organ": "Organ", "percussion": "Percussion", "piano": "Piano", "saxophone": "Saxophone", "tenor_trombone": "Trombone",
    "trumpet": "Trumpet", "tuba": "Tuba", "viola": "Viola", "violin": "Violin", "voice": "Voice",
    "choral_conducting": "Conducting", "orchestral_conducting": "Conducting", "wind_conducting": "Conducting",
    "contemporary_media_film_composition": "Film and Game Scoring", "music_creation_technology": "Computer Music",
    "music_theory": "Music Theory Pedagogy", "musicology": "Musicology",
}


def enrich_peabody(pkg: dict) -> None:
    index_url = "https://peabody.jhu.edu/audition-apply/auditions/audition-repertoire/"
    index_md = official_markdown(index_url)
    link_map = {norm(label).replace("*", ""): url for label, url in re.findall(r"\[([^]]+)\]\((https://peabody\.jhu\.edu/[^)#]+(?:#[^)]*)?)\)", index_md)}
    prescreen_labels = {"Cello", "Composition", "Computer Music", "Conducting", "Double Bass", "Film and Game Scoring", "Flute", "Jazz", "Music for New Media", "Musicology", "Percussion", "Piano", "Viola", "Violin", "Voice"}
    set_deadline(pkg, "2026-12-01", index_url, "Regular Decision applications and required pre-screen materials are due December 1.")
    for program in pkg["program_offerings"]:
        current = audition_by_ref(pkg)[program["program_offering_ref"]]
        if current.get("repertoire_summary") and current.get("prescreening_required") != "Varies" and current.get("audition_required") != "Varies":
            continue
        track = norm(program.get("track_or_concentration"))
        if "Historical Performance" in track:
            label = "Early Music"
        elif "Jazz" in track or program["field_ref"] == "bass":
            label = "Jazz"
        else:
            label = PEABODY_FIELD.get(program["field_ref"])
        url = link_map.get(label or "")
        if not url:
            continue
        entries = markdown_text_blocks(official_markdown(url))
        # Restrict Historical Performance and Jazz pages to the instrument subsection where possible.
        section = entries
        if label in {"Early Music", "Jazz"}:
            instrument = {"double_bass": "Bass", "tenor_trombone": "Trombone"}.get(program["field_ref"], program["field_ref"].replace("_", " ").title())
            section = heading_section(entries, [instrument]) or entries
        selected = degree_repertoire(section, program["degree_level_ref"])
        pre, aud, status = split_prescreen_audition([(f"h{k}" if isinstance(k, int) and k <= 6 else "li" if k == 7 else "p", v) for k, v in section])
        prescreen = "Yes" if label in prescreen_labels or (label == "Early Music" and program["field_ref"] == "voice") else "No"
        if prescreen == "Yes" and not pre: pre = selected
        if not aud: aud = selected
        nonperformance = label in {"Composition", "Computer Music", "Film and Game Scoring", "Music Theory Pedagogy", "Musicology"}
        set_audition(
            pkg, program, url=url, prescreen=prescreen,
            audition_required="No" if nonperformance else "Yes",
            audition_format="Unknown" if nonperformance else "Live or Recorded",
            prescreen_lines=pre,
            audition_lines=[] if nonperformance else aud,
            status_quote=status or "The official repertoire page lists the program's prescreening, portfolio, interview, or audition requirements.",
            deadline="2026-12-01" if prescreen == "Yes" else None,
        )
        program["program_url"] = url




def main() -> int:
    packages = load_all()
    enrichers = {
        "yale_school_of_music": enrich_yale,
        "jacobs_school_of_music": enrich_jacobs,
        "university_of_michigan_smtd": enrich_michigan,
        "northwestern_bienen_school_of_music": enrich_northwestern,
        "usc_thornton_school_of_music": enrich_usc,
        "rice_shepherd_school_of_music": enrich_rice,
        "peabody_institute": enrich_peabody,
        "oberlin_conservatory_of_music": enrich_oberlin,
        "cleveland_institute_of_music": enrich_cleveland,
    }
    selected = set(sys.argv[1:]) or set(enrichers)
    unknown = selected - set(enrichers)
    if unknown:
        raise SystemExit(f"Unknown package name(s): {', '.join(sorted(unknown))}")
    for name in selected:
        enrichers[name](packages[name])
    for name in selected:
        pkg = packages[name]
        for program in pkg["program_offerings"]:
            program["last_checked"] = TODAY
        for audition in pkg["audition_requirements"]:
            for field in ("prescreening_required", "audition_required", "audition_format"):
                if audition.get(field) == "Varies":
                    audition[field] = "Unknown"
                    audition["review_status"] = "Needs Review"
                    audition["conditional_notes"] = norm(
                        (audition.get("conditional_notes") or "")
                        + f" {field} could not be resolved to one official program-specific value after the available area pages were checked on {TODAY}."
                    )
        refresh_data_quality(pkg)
        save(pkg, PACKAGE_PATHS[name])
    print("Enriched STAGE V4 packages: " + ", ".join(sorted(selected)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

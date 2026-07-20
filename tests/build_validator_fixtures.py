#!/usr/bin/env python3
"""Build deterministic validator fixtures from the canonical passing example."""

from __future__ import annotations

import copy
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "tests/fixtures/validator"
BASE = json.loads((ROOT / "data/examples/example_conservatory.json").read_text(encoding="utf-8"))


def write(name: str, package: dict) -> None:
    (OUT / name).write_text(
        json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


OUT.mkdir(parents=True, exist_ok=True)
write("pass.json", BASE)
(OUT / "fail_invalid_json.json").write_text('{"schema_version":\n', encoding="utf-8")

cases: dict[str, dict] = {}


def case(name: str) -> dict:
    package = copy.deepcopy(BASE)
    cases[name] = package
    return package


case("wrong_schema")["schema_version"] = "stage_music_admissions_v2"
del case("missing_envelope")["source_records"]
del case("missing_required_field")["program_offerings"][0]["program_url"]
case("unseeded_field")["program_offerings"][0]["field_ref"] = "kazoo"
case("unseeded_degree")["program_offerings"][0]["degree_level_ref"] = "phd"
case("orphan_requirement")["application_requirements"][0]["program_offering_ref"] = "missing_program"
case("orphan_source")["source_records"][0]["program_offering_ref"] = "missing_program"
case("invalid_enum")["application_requirements"][0]["scholarships_available"] = "yes"
case("malformed_date")["program_offerings"][0]["last_checked"] = "2026-02-30"
case("malformed_cycle")["application_requirements"][0]["admission_cycle"] = "2026"
case("nonnumeric")["application_requirements"][0]["tuition_annual"] = "ten thousand"
del case("tuition_without_currency")["application_requirements"][0]["tuition_currency"]

package = case("duplicate_program")
package["program_offerings"].append(copy.deepcopy(package["program_offerings"][0]))

package = case("duplicate_requirement")
package["application_requirements"].append(copy.deepcopy(package["application_requirements"][0]))

case("application_current_count")["application_requirements"][0]["is_current"] = False
case("audition_current_count")["audition_requirements"][0]["is_current"] = False

package = case("prescreen_yes_no_deadline")
package["audition_requirements"][0]["prescreening_required"] = "Yes"

package = case("missing_support")
package["source_records"] = [
    source for source in package["source_records"] if source.get("related_field") != "toefl_minimum"
]

case("toefl_range")["application_requirements"][0]["toefl_minimum"] = 121
case("ielts_increment")["application_requirements"][0]["ielts_minimum"] = 6.3
case("internal_id")["program_offerings"][0]["id"] = 99

package = case("duplicate_source")
package["source_records"].append(copy.deepcopy(package["source_records"][0]))

for name, package in cases.items():
    write(f"fail_{name}.json", package)

print(f"wrote {len(cases) + 2} validator fixtures")

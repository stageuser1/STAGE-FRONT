from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VALIDATOR = ROOT / "scripts/validate_package.py"
FIXTURES = ROOT / "tests/fixtures/validator"


class ValidatorCliTests(unittest.TestCase):
    def run_fixture(self, name: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(VALIDATOR), str(FIXTURES / name)],
            cwd=ROOT,
            text=True,
            encoding="utf-8",
            capture_output=True,
            check=False,
        )

    def test_passing_package_and_json_report(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            report = Path(directory) / "report.json"
            result = subprocess.run(
                [
                    sys.executable,
                    str(VALIDATOR),
                    str(FIXTURES / "pass.json"),
                    "--json-report",
                    str(report),
                ],
                cwd=ROOT,
                text=True,
                encoding="utf-8",
                capture_output=True,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("Result: PASS", result.stdout)
            self.assertTrue(json.loads(report.read_text(encoding="utf-8"))["valid"])

    def test_each_hard_failure_class(self) -> None:
        cases = {
            "fail_invalid_json.json": "invalid JSON",
            "fail_wrong_schema.json": "schema_version must be exactly",
            "fail_missing_envelope.json": "missing required envelope key",
            "fail_missing_required_field.json": "missing required field",
            "fail_unseeded_field.json": "unseeded field_ref",
            "fail_unseeded_degree.json": "unseeded degree_level_ref",
            "fail_orphan_requirement.json": "orphan program_offering_ref",
            "fail_orphan_source.json": "orphan program_offering_ref",
            "fail_invalid_enum.json": "invalid enum",
            "fail_malformed_date.json": "malformed date",
            "fail_malformed_cycle.json": "malformed admission cycle",
            "fail_nonnumeric.json": "must be numeric or null",
            "fail_tuition_without_currency.json": "tuition_annual present without tuition_currency",
            "fail_duplicate_program.json": "duplicate program_offering_ref",
            "fail_duplicate_requirement.json": "duplicate (application_requirements) program/cycle",
            "fail_application_current_count.json": "application_requirements must have exactly one is_current true",
            "fail_audition_current_count.json": "audition_requirements must have exactly one is_current true",
            "fail_prescreen_yes_no_deadline.json": "prescreening_required Yes with null deadline",
            "fail_missing_support.json": "stated toefl_minimum has no supporting source record",
            "fail_toefl_range.json": "toefl_minimum outside 0-120",
            "fail_ielts_increment.json": "ielts_minimum must be 0-9 in 0.5 increments",
            "fail_internal_id.json": "Directus internal ID key is prohibited",
            "fail_duplicate_source.json": "duplicate source natural key",
        }
        for fixture, message in cases.items():
            with self.subTest(fixture=fixture):
                result = self.run_fixture(fixture)
                self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
                self.assertIn(message, result.stdout)


if __name__ == "__main__":
    unittest.main()

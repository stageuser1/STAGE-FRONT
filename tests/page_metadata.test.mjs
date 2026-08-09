import test from "node:test";
import assert from "node:assert/strict";

import {
  programMetadata,
  schoolMetadata,
} from "../lib/program-v3/page-metadata.ts";
import { fixtureProgramsV3 } from "./fixtures/real-programs.ts";

/**
 * 2026-08-09 验收发现:预览面只导出了 `robots`,复核者看到的是根布局的默认
 * title —— 而阶段三的人工复核正是拿 `?preview=` 逐页核对的,标题也在核对
 * 范围内。映射抽成单一来源后,这组测试钉住"预览与上线逐字相同、只差 noindex"。
 */

const program = fixtureProgramsV3[0];

test("院校页:预览与公开的 title/description 逐字相同,只差 noindex", () => {
  const pub = schoolMetadata(program);
  const preview = schoolMetadata(program, { preview: true });
  assert.equal(preview.title, pub.title);
  assert.equal(preview.description, pub.description);
  assert.deepEqual(preview.robots, { index: false, follow: false });
  assert.equal(pub.robots, undefined);
});

test("专业页:预览与公开的 title/description 逐字相同,只差 noindex", () => {
  const pub = programMetadata(program);
  const preview = programMetadata(program, { preview: true });
  assert.equal(preview.title, pub.title);
  assert.equal(preview.description, pub.description);
  assert.deepEqual(preview.robots, { index: false, follow: false });
  assert.equal(pub.robots, undefined);
});

test("标题带上校名与专业名,不是默认标题", () => {
  const school = schoolMetadata(program);
  assert.match(school.title, /招生信息 · STAGE$/);
  assert.ok(
    school.title.includes(
      program.school.school_name_zh ?? program.school.school_name,
    ),
  );

  const prog = programMetadata(program);
  assert.match(prog.title, /申请要求 · STAGE$/);
  assert.ok(
    prog.title.includes(
      program.offering.program_name_zh ?? program.offering.official_program_name,
    ),
  );
});

test("找不到院校/专业时不编标题:公开面返回空,预览面仍 noindex", () => {
  assert.deepEqual(schoolMetadata(undefined), {});
  assert.deepEqual(programMetadata(undefined), {});
  assert.deepEqual(schoolMetadata(undefined, { preview: true }), {
    robots: { index: false, follow: false },
  });
  assert.deepEqual(programMetadata(undefined, { preview: true }), {
    robots: { index: false, follow: false },
  });
});

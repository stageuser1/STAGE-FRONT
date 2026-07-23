#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "UK_music_conservatoires");
const dirs = (await readdir(root, { withFileTypes: true })).filter((d) => d.isDirectory());
const uses = new Map();

for (const dirent of dirs) {
  const file = path.join(root, dirent.name, "programs.json");
  const data = JSON.parse(await readFile(file, "utf8"));
  const add = (url, use) => {
    if (!url) return;
    if (!uses.has(url)) uses.set(url, []);
    uses.get(url).push(`${dirent.name}:${use}`);
  };
  add(data.school.official_website, "official_website");
  for (const p of data.program_offerings) {
    add(p.program_url, `${p.program_offering_ref}.program_url`);
    add(p.application_url, `${p.program_offering_ref}.application_url`);
    add(p.audition_url, `${p.program_offering_ref}.audition_url`);
  }
  for (const s of data.source_records) add(s.source_url, `${s.program_offering_ref || s.school_ref}.source_url`);
}

const entries = [...uses.entries()];
const results = [];
let index = 0;
async function worker() {
  while (index < entries.length) {
    const [url, usedBy] = entries[index++];
    try {
      const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "user-agent": "Mozilla/5.0 STAGE extraction URL validator" } });
      results.push({ url, status: response.status, ok: (response.status >= 200 && response.status < 400) || [401, 403, 429].includes(response.status), finalUrl: response.url, usedBy });
      await response.body?.cancel();
    } catch (error) {
      results.push({ url, status: null, ok: false, error: String(error.message || error), usedBy });
    }
  }
}

await Promise.all(Array.from({ length: 2 }, () => worker()));
results.sort((a, b) => a.url.localeCompare(b.url));
const bad = results.filter((r) => !r.ok);
console.log(JSON.stringify({ checked: results.length, passed: results.length - bad.length, failed: bad.length, failures: bad.map(({ url, status, error }) => ({ url, status, error })) }, null, 2));
process.exitCode = bad.length ? 1 : 0;

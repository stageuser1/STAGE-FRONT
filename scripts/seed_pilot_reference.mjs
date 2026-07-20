#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

async function loadDotEnv(file) {
  try {
    for (const line of (await readFile(file, "utf8")).split(/\r?\n/)) {
      const match = line.match(/^\s*([^#][^=]*)=(.*)$/);
      if (!match) continue;
      process.env[match[1].trim()] ??= match[2].trim().replace(/^['"]|['"]$/g, "");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const root = path.resolve(import.meta.dirname, "..");
await loadDotEnv(process.env.DIRECTUS_ENV_FILE ?? path.join(root, ".env.local"));
const baseUrl = process.env.DIRECTUS_URL?.replace(/\/+$/, "");
const token = process.env.DIRECTUS_TOKEN;
if (!baseUrl || !token) throw new Error("DIRECTUS_URL and DIRECTUS_TOKEN are required");

async function api(method, apiPath, body) {
  const response = await fetch(`${baseUrl}${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.errors?.map(({ message }) => message).join("; ") ?? response.statusText);
  }
  return payload.data;
}

function query(collection, filter, fields = "*") {
  const search = new URLSearchParams({ limit: "-1", fields, filter: JSON.stringify(filter) });
  return api("GET", `/items/${collection}?${search}`);
}

const journal = [];
const countryValues = {
  country_name: "United States",
  visa_summary:
    "International students generally need F-1 student status and a Form I-20 issued by their school before applying for an F-1 visa. Students must maintain their status and follow their school's international-student guidance on enrollment and employment authorization.",
  post_study_work:
    "F-1 students may be eligible for up to 12 months of Optional Practical Training (OPT). A further 24-month STEM extension is available only for qualifying STEM degrees, employers, and students.",
  notes: "Conservative country-level summary; individual eligibility requires official advice.",
  last_reviewed: "2026-07-19",
};
let [country] = await query("countries", { country_name: { _eq: "United States" } });
if (!country) {
  country = await api("POST", "/items/countries", countryValues);
  journal.push({ action: "create", collection: "countries", id: country.id });
} else {
  const changed = Object.fromEntries(
    Object.entries(countryValues).filter(([key, value]) => country[key] !== value),
  );
  if (Object.keys(changed).length) {
    await api("PATCH", `/items/countries/${country.id}`, changed);
    journal.push({ action: "update", collection: "countries", id: country.id, fields: Object.keys(changed) });
  }
}

const cityValues = {
  city_name: "New York",
  country_ref: country.id,
  living_cost_band: "Very High",
  living_cost_monthly_est: null,
  living_cost_currency: null,
  last_reviewed: "2026-07-19",
};
let [city] = await query("cities", {
  _and: [{ city_name: { _eq: "New York" } }, { country_ref: { _eq: country.id } }],
});
if (!city) {
  city = await api("POST", "/items/cities", cityValues);
  journal.push({ action: "create", collection: "cities", id: city.id });
} else {
  const changed = Object.fromEntries(
    Object.entries(cityValues).filter(([key, value]) => String(city[key] ?? "") !== String(value ?? "")),
  );
  if (Object.keys(changed).length) {
    await api("PATCH", `/items/cities/${city.id}`, changed);
    journal.push({ action: "update", collection: "cities", id: city.id, fields: Object.keys(changed) });
  }
}

const [school] = await query("schools", { slug: { _eq: "manhattan_school_of_music" } }, "id,slug,city_ref");
if (!school) throw new Error("Pilot school manhattan_school_of_music was not found");
const currentCityId = typeof school.city_ref === "object" ? school.city_ref?.id : school.city_ref;
if (String(currentCityId ?? "") !== String(city.id)) {
  await api("PATCH", `/items/schools/${school.id}`, { city_ref: city.id });
  journal.push({ action: "update", collection: "schools", id: school.id, fields: ["city_ref"] });
}

const result = { country_id: country.id, city_id: city.id, school_id: school.id, journal };
const rendered = `${JSON.stringify(result, null, 2)}\n`;
const reportIndex = process.argv.indexOf("--report");
if (reportIndex !== -1) {
  const reportPath = process.argv[reportIndex + 1];
  if (!reportPath) throw new Error("--report requires a path");
  await writeFile(path.resolve(reportPath), rendered, "utf8");
}
process.stdout.write(rendered);

/**
 * Writes public/fixtures/audio/silence-placeholder.mp3 — the stand-in audio for
 * the Listening fixture set.
 *
 * The file is synthesised rather than sourced, so no recording of any kind
 * enters the repository. Each frame is a valid MPEG-1 Layer III header
 * (32 kbps, 44.1 kHz, mono, no CRC) followed by zeroed frame data, which every
 * decoder renders as silence. 40 frames of 1152 samples is ~1.04 s in ~4 KB.
 *
 * Usage: node scripts/make-silence-mp3.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HEADER = Uint8Array.from([0xff, 0xfb, 0x10, 0xc0]);
const SAMPLES_PER_FRAME = 1152;
const BITRATE = 32_000;
const SAMPLE_RATE = 44_100;
const FRAME_BYTES = Math.floor((144 * BITRATE) / SAMPLE_RATE); // 104
const FRAME_COUNT = 40;

const frame = new Uint8Array(FRAME_BYTES);
frame.set(HEADER, 0); // the remaining bytes stay zero

const out = new Uint8Array(FRAME_BYTES * FRAME_COUNT);
for (let i = 0; i < FRAME_COUNT; i += 1) out.set(frame, i * FRAME_BYTES);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "public", "fixtures", "audio", "silence-placeholder.mp3");

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, out);

const seconds = ((SAMPLES_PER_FRAME * FRAME_COUNT) / SAMPLE_RATE).toFixed(2);
console.log(`wrote ${target} (${out.length} bytes, ~${seconds}s of silence)`);

import type { Program } from "./types";
import { europeanProgram } from "./sample/european-program";
import { juilliardVoiceBm } from "./sample/juilliard-voice-bm";
import { ukMasterProgram } from "./sample/uk-master-program";

export const programs: Program[] = [
  juilliardVoiceBm,
  ukMasterProgram,
  europeanProgram,
];

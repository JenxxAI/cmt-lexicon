import { DISPLAY_SAMPLES } from "./samples-display";
import { FORM_SAMPLES } from "./samples-form";
import type { SampleId } from "./sample-ids";
import type { Sample } from "./types";

/** Every id in SAMPLE_IDS must be defined here (type-checked). */
export const SAMPLES: Record<SampleId, Sample> = { ...FORM_SAMPLES, ...DISPLAY_SAMPLES };

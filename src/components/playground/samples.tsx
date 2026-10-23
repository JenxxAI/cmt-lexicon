import { CONTENT_SAMPLES } from "./samples-content";
import { DISPLAY_SAMPLES } from "./samples-display";
import { FORM_SAMPLES } from "./samples-form";
import { INPUT_SAMPLES } from "./samples-input";
import { LAYOUT_SAMPLES } from "./samples-layout";
import { OVERLAY_SAMPLES } from "./samples-overlay";
import type { SampleId } from "./sample-ids";
import type { Sample } from "./types";

/** Every id in SAMPLE_IDS must be defined here (type-checked). */
export const SAMPLES: Record<SampleId, Sample> = {
  ...FORM_SAMPLES,
  ...DISPLAY_SAMPLES,
  ...LAYOUT_SAMPLES,
  ...CONTENT_SAMPLES,
  ...INPUT_SAMPLES,
  ...OVERLAY_SAMPLES,
};

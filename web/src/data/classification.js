/*
  How a classifier result is described in the interface.

  The five rules and the four labels come straight from
  classifier/rules_baseline.py. If Raja changes a rule, change the copy here
  so the site is not quietly describing an old classifier.

  Confidence is judged on the Error scalar, not on Wt1. The client confirmed
  Wt1 equal to 1.0 means a single dominant mineral was found, so it says
  nothing about how trustworthy a reading is. Lower Error is better.
*/

/* classifier/rules_baseline.py: EXPECTED_MAX_ERROR.
   Placeholder, recalibrated by Raja to the rounded 75th percentile of the
   observed Error distribution. Not a client validated number. */
export const EXPECTED_MAX_ERROR = 307;

/* Anything past this fraction of the ceiling is worth flagging even though it
   still passes the gate, so a reader can see a reading is marginal. */
const CAUTION_FRACTION = 0.6;

export const LABELS = {
  "Possible ore zone": {
    tone: "ore",
    blurb: "Carbonate and chlorite both above the provisional ore indication thresholds.",
  },
  "Altered zone": {
    tone: "altered",
    blurb: "Phyllic style alteration, white mica and chlorite together.",
  },
  "Waste rock": {
    tone: "waste",
    blurb: "Dark mica dominant with little white mica or carbonate.",
  },
  Unclassified: {
    tone: "unclassified",
    blurb: "No rule threshold was met. This interval needs expert review.",
  },
};

export const RULES = {
  R1_phyllic: { short: "R1", name: "Phyllic alteration" },
  R2_ore: { short: "R2", name: "Provisional ore indication" },
  R3_waste: { short: "R3", name: "Mica rich waste" },
  R4_low_data: { short: "R4", name: "Too few scan points" },
  R5_no_match: { short: "R5", name: "No rule matched" },
};

export function labelTone(label) {
  return LABELS[label]?.tone ?? "unclassified";
}

export function ruleName(ruleFired) {
  return RULES[ruleFired]?.name ?? ruleFired;
}

export function ruleShort(ruleFired) {
  return RULES[ruleFired]?.short ?? ruleFired;
}

/*
  Turn a raw Error value into one of three states.
  "good"    reading sits comfortably inside the gate
  "caution" reading passes but is close to the ceiling
  "problem" reading fails the gate, or the interval was masked out entirely

  Always render the returned state with its icon and its text label. Colour on
  its own is not allowed to carry this meaning.
*/
export function confidenceState(confidenceError, finalMask = true) {
  if (finalMask === false) {
    return { state: "problem", text: "Excluded by mask", icon: "x" };
  }
  if (confidenceError == null || Number.isNaN(confidenceError)) {
    return { state: "problem", text: "No error value", icon: "x" };
  }
  if (confidenceError > EXPECTED_MAX_ERROR) {
    return { state: "problem", text: "Above error ceiling", icon: "x" };
  }
  if (confidenceError > EXPECTED_MAX_ERROR * CAUTION_FRACTION) {
    return { state: "caution", text: "Marginal error", icon: "alert" };
  }
  return { state: "good", text: "Within error gate", icon: "check" };
}

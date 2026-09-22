/*
  Placeholder data for the web skeleton, Task 8.

  None of this is real survey data. It is hand authored so the pages have
  something honest shaped to lay out against while the API work lands. The
  field names deliberately mirror the API contract exactly, so swapping the
  source is a one line change rather than a rewrite:

    GET /holes                      -> { count, holes: [...] }
    GET /holes/{hole_id}            -> one hole object
    GET /holes/{hole_id}/intervals  -> { hole_id, count, intervals: [...] }
      optional query: min_confidence, keeps rows whose confidence_error is at
      or below the threshold, because a lower Error means a better reading

  Task 9 (Sahaj) replaces the three functions at the bottom of this file with
  Axios calls in web/src/api/client.js. Nothing above them needs to change.

  One gap worth flagging before Task 10: the intervals endpoint does not
  currently return per mineral percentages, only the classifier outcome. The
  `minerals` object below is what the mineral breakdown chart needs, so either
  the interval endpoint grows a minerals payload or the site needs a second
  call. Raise it with Zhenghao rather than assuming it is there.

  The numbers are internally consistent: every interval below was run through
  the same five rules as classifier/rules_baseline.py, so the label, the
  rule_fired value and the reason text all agree with the mineral mix.
*/


export const PLACEHOLDER_HOLES = [
  {
    "hole_id": "05GJD001",
    "region": "Kalgoorlie",
    "latitude": -30.712,
    "longitude": 121.395,
    "total_depth_m": 260.0,
    "intervals_classified": 6
  },
  {
    "hole_id": "05KCD001",
    "region": "Kambalda",
    "latitude": -31.204,
    "longitude": 121.663,
    "total_depth_m": 305.0,
    "intervals_classified": 5
  },
  {
    "hole_id": "07THD002",
    "region": "Tropicana",
    "latitude": -29.198,
    "longitude": 124.539,
    "total_depth_m": 412.0,
    "intervals_classified": 6
  },
  {
    "hole_id": "09ATD015",
    "region": "Albany Fraser",
    "latitude": -32.881,
    "longitude": 122.104,
    "total_depth_m": 198.0,
    "intervals_classified": 5
  },
  {
    "hole_id": "09DKRCD002",
    "region": "Duketon",
    "latitude": -27.641,
    "longitude": 122.283,
    "total_depth_m": 340.0,
    "intervals_classified": 5
  },
  {
    "hole_id": "09RTD001",
    "region": "Ravensthorpe",
    "latitude": -33.583,
    "longitude": 120.047,
    "total_depth_m": 226.0,
    "intervals_classified": 5
  },
  {
    "hole_id": "10CHD006",
    "region": "Cue",
    "latitude": -27.427,
    "longitude": 117.892,
    "total_depth_m": 288.0,
    "intervals_classified": 5
  },
  {
    "hole_id": "09THD029",
    "region": "Tropicana",
    "latitude": -29.244,
    "longitude": 124.601,
    "total_depth_m": 356.0,
    "intervals_classified": 6
  }
];


export const PLACEHOLDER_INTERVALS = {
  "05GJD001": [
    {
      depth_from_m: 150,
      depth_to_m: 170,
      label: "Unclassified",
      confidence: 0.4,
      rule_fired: "R5_no_match",
      reason: "No rule threshold was met. Needs expert review.",
      final_mask: true,
      confidence_error: 118.4,
      minerals: { "CHLORITE": 57.0, "WHITE-MICA": 8.0, "CARBONATE": 10.0, "AMPHIBOLE": 0.0, "DARK-MICA": 23.0, "OTHER": 2.0 },
    },
    {
      depth_from_m: 170,
      depth_to_m: 190,
      label: "Possible ore zone",
      confidence: 0.67,
      rule_fired: "R2_ore",
      reason: "Carbonate 28% and chlorite 24% exceed the provisional ore indication thresholds.",
      final_mask: true,
      confidence_error: 96.2,
      minerals: { "CHLORITE": 24.0, "WHITE-MICA": 9.0, "CARBONATE": 28.0, "AMPHIBOLE": 31.0, "DARK-MICA": 8.0, "OTHER": 0.0 },
    },
    {
      depth_from_m: 190,
      depth_to_m: 210,
      label: "Altered zone",
      confidence: 0.67,
      rule_fired: "R1_phyllic",
      reason: "White mica 46% and chlorite 31% are both above their thresholds.",
      final_mask: true,
      confidence_error: 142.7,
      minerals: { "CHLORITE": 31.0, "WHITE-MICA": 46.0, "CARBONATE": 9.0, "AMPHIBOLE": 8.0, "DARK-MICA": 0.0, "OTHER": 6.0 },
    },
    {
      depth_from_m: 210,
      depth_to_m: 230,
      label: "Waste rock",
      confidence: 0.68,
      rule_fired: "R3_waste",
      reason: "Dark mica 63% dominates with low white mica 9% and carbonate 7%.",
      final_mask: true,
      confidence_error: 201.5,
      minerals: { "CHLORITE": 12.0, "WHITE-MICA": 9.0, "CARBONATE": 7.0, "AMPHIBOLE": 0.0, "DARK-MICA": 63.0, "OTHER": 9.0 },
    },
    {
      depth_from_m: 230,
      depth_to_m: 250,
      label: "Possible ore zone",
      confidence: 0.69,
      rule_fired: "R2_ore",
      reason: "Carbonate 27% and chlorite 26% exceed the provisional ore indication thresholds.",
      final_mask: true,
      confidence_error: 88.9,
      minerals: { "CHLORITE": 26.0, "WHITE-MICA": 21.0, "CARBONATE": 27.0, "AMPHIBOLE": 14.0, "DARK-MICA": 0.0, "OTHER": 12.0 },
    },
    {
      depth_from_m: 250,
      depth_to_m: 260,
      label: "Unclassified",
      confidence: 0.25,
      rule_fired: "R5_no_match",
      reason: "Error 388.1 fails the confidence gate of 0 to 307; needs expert review.",
      final_mask: true,
      confidence_error: 388.1,
      minerals: { "CHLORITE": 18.0, "WHITE-MICA": 22.0, "CARBONATE": 6.0, "AMPHIBOLE": 11.0, "DARK-MICA": 0.0, "OTHER": 43.0 },
    },
  ],
  "05KCD001": [
    {
      depth_from_m: 60,
      depth_to_m: 90,
      label: "Altered zone",
      confidence: 0.63,
      rule_fired: "R1_phyllic",
      reason: "White mica 41% and chlorite 44% are both above their thresholds.",
      final_mask: true,
      confidence_error: 74.3,
      minerals: { "CHLORITE": 44.0, "WHITE-MICA": 41.0, "CARBONATE": 6.0, "AMPHIBOLE": 0.0, "DARK-MICA": 0.0, "OTHER": 9.0 },
    },
    {
      depth_from_m: 90,
      depth_to_m: 120,
      label: "Altered zone",
      confidence: 0.65,
      rule_fired: "R1_phyllic",
      reason: "White mica 44% and chlorite 38% are both above their thresholds.",
      final_mask: true,
      confidence_error: 69.8,
      minerals: { "CHLORITE": 38.0, "WHITE-MICA": 44.0, "CARBONATE": 8.0, "AMPHIBOLE": 0.0, "DARK-MICA": 5.0, "OTHER": 5.0 },
    },
    {
      depth_from_m: 120,
      depth_to_m: 150,
      label: "Possible ore zone",
      confidence: 0.62,
      rule_fired: "R2_ore",
      reason: "Carbonate 19% and chlorite 21% exceed the provisional ore indication thresholds.",
      final_mask: true,
      confidence_error: 130.2,
      minerals: { "CHLORITE": 21.0, "WHITE-MICA": 18.0, "CARBONATE": 19.0, "AMPHIBOLE": 26.0, "DARK-MICA": 0.0, "OTHER": 16.0 },
    },
    {
      depth_from_m: 150,
      depth_to_m: 180,
      label: "Waste rock",
      confidence: 0.63,
      rule_fired: "R3_waste",
      reason: "Dark mica 58% dominates with low white mica 11% and carbonate 6%.",
      final_mask: true,
      confidence_error: 165.0,
      minerals: { "CHLORITE": 14.0, "WHITE-MICA": 11.0, "CARBONATE": 6.0, "AMPHIBOLE": 0.0, "DARK-MICA": 58.0, "OTHER": 11.0 },
    },
    {
      depth_from_m: 180,
      depth_to_m: 210,
      label: "Unclassified",
      confidence: 0.4,
      rule_fired: "R5_no_match",
      reason: "No rule threshold was met. Needs expert review.",
      final_mask: true,
      confidence_error: 244.6,
      minerals: { "CHLORITE": 33.0, "WHITE-MICA": 29.0, "CARBONATE": 12.0, "AMPHIBOLE": 9.0, "DARK-MICA": 0.0, "OTHER": 17.0 },
    },
  ],
  "07THD002": [
    {
      depth_from_m: 100,
      depth_to_m: 140,
      label: "Unclassified",
      confidence: 0.4,
      rule_fired: "R5_no_match",
      reason: "No rule threshold was met. Needs expert review.",
      final_mask: true,
      confidence_error: 92.1,
      minerals: { "CHLORITE": 49.0, "WHITE-MICA": 30.0, "CARBONATE": 0.0, "AMPHIBOLE": 11.0, "DARK-MICA": 0.0, "OTHER": 10.0 },
    },
    {
      depth_from_m: 140,
      depth_to_m: 180,
      label: "Possible ore zone",
      confidence: 0.65,
      rule_fired: "R2_ore",
      reason: "Carbonate 22% and chlorite 27% exceed the provisional ore indication thresholds.",
      final_mask: true,
      confidence_error: 110.5,
      minerals: { "CHLORITE": 27.0, "WHITE-MICA": 24.0, "CARBONATE": 22.0, "AMPHIBOLE": 13.0, "DARK-MICA": 0.0, "OTHER": 14.0 },
    },
    {
      depth_from_m: 180,
      depth_to_m: 220,
      label: "Waste rock",
      confidence: 0.74,
      rule_fired: "R3_waste",
      reason: "Dark mica 69% dominates with low white mica 6% and carbonate 4%.",
      final_mask: true,
      confidence_error: 187.4,
      minerals: { "CHLORITE": 8.0, "WHITE-MICA": 6.0, "CARBONATE": 4.0, "AMPHIBOLE": 0.0, "DARK-MICA": 69.0, "OTHER": 13.0 },
    },
    {
      depth_from_m: 220,
      depth_to_m: 260,
      label: "Altered zone",
      confidence: 0.65,
      rule_fired: "R1_phyllic",
      reason: "White mica 43% and chlorite 35% are both above their thresholds.",
      final_mask: true,
      confidence_error: 58.7,
      minerals: { "CHLORITE": 35.0, "WHITE-MICA": 43.0, "CARBONATE": 7.0, "AMPHIBOLE": 0.0, "DARK-MICA": 0.0, "OTHER": 15.0 },
    },
    {
      depth_from_m: 260,
      depth_to_m: 300,
      label: "Unclassified",
      confidence: 0.25,
      rule_fired: "R5_no_match",
      reason: "Error 421.9 fails the confidence gate of 0 to 307; needs expert review.",
      final_mask: true,
      confidence_error: 421.9,
      minerals: { "CHLORITE": 19.0, "WHITE-MICA": 17.0, "CARBONATE": 11.0, "AMPHIBOLE": 22.0, "DARK-MICA": 0.0, "OTHER": 31.0 },
    },
    {
      depth_from_m: 300,
      depth_to_m: 340,
      label: "Unclassified",
      confidence: 0.25,
      rule_fired: "R4_low_data",
      reason: "Only 12 scan points, below the minimum of 20.",
      final_mask: true,
      confidence_error: 77.2,
      minerals: { "CHLORITE": 41.0, "WHITE-MICA": 38.0, "CARBONATE": 9.0, "AMPHIBOLE": 0.0, "DARK-MICA": 0.0, "OTHER": 12.0 },
    },
  ],
  "09ATD015": [
    {
      depth_from_m: 40,
      depth_to_m: 70,
      label: "Unclassified",
      confidence: 0.4,
      rule_fired: "R5_no_match",
      reason: "No rule threshold was met. Needs expert review.",
      final_mask: true,
      confidence_error: 102.8,
      minerals: { "CHLORITE": 52.0, "WHITE-MICA": 24.0, "CARBONATE": 13.0, "AMPHIBOLE": 0.0, "DARK-MICA": 0.0, "OTHER": 11.0 },
    },
    {
      depth_from_m: 70,
      depth_to_m: 100,
      label: "Possible ore zone",
      confidence: 0.69,
      rule_fired: "R2_ore",
      reason: "Carbonate 26% and chlorite 29% exceed the provisional ore indication thresholds.",
      final_mask: true,
      confidence_error: 84.5,
      minerals: { "CHLORITE": 29.0, "WHITE-MICA": 20.0, "CARBONATE": 26.0, "AMPHIBOLE": 12.0, "DARK-MICA": 0.0, "OTHER": 13.0 },
    },
    {
      depth_from_m: 100,
      depth_to_m: 130,
      label: "Waste rock",
      confidence: 0.61,
      rule_fired: "R3_waste",
      reason: "Dark mica 56% dominates with low white mica 13% and carbonate 5%.",
      final_mask: true,
      confidence_error: 149.3,
      minerals: { "CHLORITE": 16.0, "WHITE-MICA": 13.0, "CARBONATE": 5.0, "AMPHIBOLE": 0.0, "DARK-MICA": 56.0, "OTHER": 10.0 },
    },
    {
      depth_from_m: 130,
      depth_to_m: 160,
      label: "Altered zone",
      confidence: 0.66,
      rule_fired: "R1_phyllic",
      reason: "White mica 47% and chlorite 30% are both above their thresholds.",
      final_mask: true,
      confidence_error: 63.4,
      minerals: { "CHLORITE": 30.0, "WHITE-MICA": 47.0, "CARBONATE": 8.0, "AMPHIBOLE": 0.0, "DARK-MICA": 0.0, "OTHER": 15.0 },
    },
    {
      depth_from_m: 160,
      depth_to_m: 198,
      label: "Unclassified",
      confidence: 0.25,
      rule_fired: "R5_no_match",
      reason: "Error 352.0 fails the confidence gate of 0 to 307; needs expert review.",
      final_mask: false,
      confidence_error: 352.0,
      minerals: { "CHLORITE": 22.0, "WHITE-MICA": 19.0, "CARBONATE": 9.0, "AMPHIBOLE": 17.0, "DARK-MICA": 0.0, "OTHER": 33.0 },
    },
  ],
  "09DKRCD002": [
    {
      depth_from_m: 80,
      depth_to_m: 110,
      label: "Unclassified",
      confidence: 0.4,
      rule_fired: "R5_no_match",
      reason: "No rule threshold was met. Needs expert review.",
      final_mask: true,
      confidence_error: 121.6,
      minerals: { "CHLORITE": 61.0, "WHITE-MICA": 15.0, "CARBONATE": 12.0, "AMPHIBOLE": 0.0, "DARK-MICA": 0.0, "OTHER": 12.0 },
    },
    {
      depth_from_m: 110,
      depth_to_m: 140,
      label: "Possible ore zone",
      confidence: 0.69,
      rule_fired: "R2_ore",
      reason: "Carbonate 31% and chlorite 26% exceed the provisional ore indication thresholds.",
      final_mask: true,
      confidence_error: 79.1,
      minerals: { "CHLORITE": 26.0, "WHITE-MICA": 14.0, "CARBONATE": 31.0, "AMPHIBOLE": 18.0, "DARK-MICA": 0.0, "OTHER": 11.0 },
    },
    {
      depth_from_m: 140,
      depth_to_m: 170,
      label: "Altered zone",
      confidence: 0.64,
      rule_fired: "R1_phyllic",
      reason: "White mica 42% and chlorite 37% are both above their thresholds.",
      final_mask: true,
      confidence_error: 66.9,
      minerals: { "CHLORITE": 37.0, "WHITE-MICA": 42.0, "CARBONATE": 6.0, "AMPHIBOLE": 0.0, "DARK-MICA": 0.0, "OTHER": 15.0 },
    },
    {
      depth_from_m: 170,
      depth_to_m: 200,
      label: "Waste rock",
      confidence: 0.69,
      rule_fired: "R3_waste",
      reason: "Dark mica 64% dominates with low white mica 8% and carbonate 5%.",
      final_mask: true,
      confidence_error: 178.2,
      minerals: { "CHLORITE": 11.0, "WHITE-MICA": 8.0, "CARBONATE": 5.0, "AMPHIBOLE": 0.0, "DARK-MICA": 64.0, "OTHER": 12.0 },
    },
    {
      depth_from_m: 200,
      depth_to_m: 230,
      label: "Unclassified",
      confidence: 0.4,
      rule_fired: "R5_no_match",
      reason: "No rule threshold was met. Needs expert review.",
      final_mask: true,
      confidence_error: 296.4,
      minerals: { "CHLORITE": 24.0, "WHITE-MICA": 21.0, "CARBONATE": 10.0, "AMPHIBOLE": 15.0, "DARK-MICA": 0.0, "OTHER": 30.0 },
    },
  ],
  "09RTD001": [
    {
      depth_from_m: 50,
      depth_to_m: 80,
      label: "Unclassified",
      confidence: 0.4,
      rule_fired: "R5_no_match",
      reason: "No rule threshold was met. Needs expert review.",
      final_mask: true,
      confidence_error: 95.7,
      minerals: { "CHLORITE": 46.0, "WHITE-MICA": 33.0, "CARBONATE": 10.0, "AMPHIBOLE": 0.0, "DARK-MICA": 0.0, "OTHER": 11.0 },
    },
    {
      depth_from_m: 80,
      depth_to_m: 110,
      label: "Possible ore zone",
      confidence: 0.61,
      rule_fired: "R2_ore",
      reason: "Carbonate 24% and chlorite 18% exceed the provisional ore indication thresholds.",
      final_mask: true,
      confidence_error: 107.3,
      minerals: { "CHLORITE": 18.0, "WHITE-MICA": 15.0, "CARBONATE": 24.0, "AMPHIBOLE": 29.0, "DARK-MICA": 0.0, "OTHER": 14.0 },
    },
    {
      depth_from_m: 110,
      depth_to_m: 140,
      label: "Altered zone",
      confidence: 0.66,
      rule_fired: "R1_phyllic",
      reason: "White mica 45% and chlorite 34% are both above their thresholds.",
      final_mask: true,
      confidence_error: 71.0,
      minerals: { "CHLORITE": 34.0, "WHITE-MICA": 45.0, "CARBONATE": 7.0, "AMPHIBOLE": 0.0, "DARK-MICA": 0.0, "OTHER": 14.0 },
    },
    {
      depth_from_m: 140,
      depth_to_m: 170,
      label: "Waste rock",
      confidence: 0.65,
      rule_fired: "R3_waste",
      reason: "Dark mica 60% dominates with low white mica 10% and carbonate 6%.",
      final_mask: true,
      confidence_error: 158.8,
      minerals: { "CHLORITE": 13.0, "WHITE-MICA": 10.0, "CARBONATE": 6.0, "AMPHIBOLE": 0.0, "DARK-MICA": 60.0, "OTHER": 11.0 },
    },
    {
      depth_from_m: 170,
      depth_to_m: 200,
      label: "Unclassified",
      confidence: 0.25,
      rule_fired: "R4_low_data",
      reason: "Only 16 scan points, below the minimum of 20.",
      final_mask: true,
      confidence_error: 118.0,
      minerals: { "CHLORITE": 28.0, "WHITE-MICA": 23.0, "CARBONATE": 12.0, "AMPHIBOLE": 13.0, "DARK-MICA": 0.0, "OTHER": 24.0 },
    },
  ],
  "10CHD006": [
    {
      depth_from_m: 70,
      depth_to_m: 100,
      label: "Unclassified",
      confidence: 0.4,
      rule_fired: "R5_no_match",
      reason: "No rule threshold was met. Needs expert review.",
      final_mask: true,
      confidence_error: 133.5,
      minerals: { "CHLORITE": 55.0, "WHITE-MICA": 21.0, "CARBONATE": 14.0, "AMPHIBOLE": 0.0, "DARK-MICA": 0.0, "OTHER": 10.0 },
    },
    {
      depth_from_m: 100,
      depth_to_m: 130,
      label: "Possible ore zone",
      confidence: 0.71,
      rule_fired: "R2_ore",
      reason: "Carbonate 28% and chlorite 30% exceed the provisional ore indication thresholds.",
      final_mask: true,
      confidence_error: 87.6,
      minerals: { "CHLORITE": 30.0, "WHITE-MICA": 17.0, "CARBONATE": 28.0, "AMPHIBOLE": 11.0, "DARK-MICA": 0.0, "OTHER": 14.0 },
    },
    {
      depth_from_m: 130,
      depth_to_m: 160,
      label: "Altered zone",
      confidence: 0.65,
      rule_fired: "R1_phyllic",
      reason: "White mica 44% and chlorite 39% are both above their thresholds.",
      final_mask: true,
      confidence_error: 61.2,
      minerals: { "CHLORITE": 39.0, "WHITE-MICA": 44.0, "CARBONATE": 5.0, "AMPHIBOLE": 0.0, "DARK-MICA": 0.0, "OTHER": 12.0 },
    },
    {
      depth_from_m: 160,
      depth_to_m: 190,
      label: "Waste rock",
      confidence: 0.62,
      rule_fired: "R3_waste",
      reason: "Dark mica 57% dominates with low white mica 12% and carbonate 7%.",
      final_mask: true,
      confidence_error: 172.9,
      minerals: { "CHLORITE": 15.0, "WHITE-MICA": 12.0, "CARBONATE": 7.0, "AMPHIBOLE": 0.0, "DARK-MICA": 57.0, "OTHER": 9.0 },
    },
    {
      depth_from_m: 190,
      depth_to_m: 220,
      label: "Unclassified",
      confidence: 0.25,
      rule_fired: "R5_no_match",
      reason: "Error 401.7 fails the confidence gate of 0 to 307; needs expert review.",
      final_mask: true,
      confidence_error: 401.7,
      minerals: { "CHLORITE": 20.0, "WHITE-MICA": 18.0, "CARBONATE": 8.0, "AMPHIBOLE": 19.0, "DARK-MICA": 0.0, "OTHER": 35.0 },
    },
  ],
  "09THD029": [
    {
      depth_from_m: 120,
      depth_to_m: 160,
      label: "Unclassified",
      confidence: 0.4,
      rule_fired: "R5_no_match",
      reason: "No rule threshold was met. Needs expert review.",
      final_mask: true,
      confidence_error: 89.4,
      minerals: { "CHLORITE": 48.0, "WHITE-MICA": 28.0, "CARBONATE": 11.0, "AMPHIBOLE": 0.0, "DARK-MICA": 0.0, "OTHER": 13.0 },
    },
    {
      depth_from_m: 160,
      depth_to_m: 200,
      label: "Possible ore zone",
      confidence: 0.64,
      rule_fired: "R2_ore",
      reason: "Carbonate 21% and chlorite 25% exceed the provisional ore indication thresholds.",
      final_mask: true,
      confidence_error: 114.8,
      minerals: { "CHLORITE": 25.0, "WHITE-MICA": 16.0, "CARBONATE": 21.0, "AMPHIBOLE": 24.0, "DARK-MICA": 0.0, "OTHER": 14.0 },
    },
    {
      depth_from_m: 200,
      depth_to_m: 240,
      label: "Altered zone",
      confidence: 0.63,
      rule_fired: "R1_phyllic",
      reason: "White mica 41% and chlorite 36% are both above their thresholds.",
      final_mask: true,
      confidence_error: 68.3,
      minerals: { "CHLORITE": 36.0, "WHITE-MICA": 41.0, "CARBONATE": 8.0, "AMPHIBOLE": 0.0, "DARK-MICA": 0.0, "OTHER": 15.0 },
    },
    {
      depth_from_m: 240,
      depth_to_m: 280,
      label: "Waste rock",
      confidence: 0.71,
      rule_fired: "R3_waste",
      reason: "Dark mica 66% dominates with low white mica 7% and carbonate 5%.",
      final_mask: true,
      confidence_error: 193.1,
      minerals: { "CHLORITE": 9.0, "WHITE-MICA": 7.0, "CARBONATE": 5.0, "AMPHIBOLE": 0.0, "DARK-MICA": 66.0, "OTHER": 13.0 },
    },
    {
      depth_from_m: 280,
      depth_to_m: 320,
      label: "Unclassified",
      confidence: 0.4,
      rule_fired: "R5_no_match",
      reason: "No rule threshold was met. Needs expert review.",
      final_mask: true,
      confidence_error: 268.5,
      minerals: { "CHLORITE": 23.0, "WHITE-MICA": 20.0, "CARBONATE": 9.0, "AMPHIBOLE": 16.0, "DARK-MICA": 0.0, "OTHER": 32.0 },
    },
    {
      depth_from_m: 320,
      depth_to_m: 356,
      label: "Unclassified",
      confidence: 0.25,
      rule_fired: "R5_no_match",
      reason: "Error 340.6 fails the confidence gate of 0 to 307; needs expert review.",
      final_mask: false,
      confidence_error: 340.6,
      minerals: { "CHLORITE": 31.0, "WHITE-MICA": 26.0, "CARBONATE": 15.0, "AMPHIBOLE": 10.0, "DARK-MICA": 0.0, "OTHER": 18.0 },
    },
  ],
};


/* A short, deliberate delay so loading states are visible while developing.
   Task 9 drops this along with the rest of the placeholder plumbing. */
const FAKE_LATENCY_MS = 320;

function settle(value) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), FAKE_LATENCY_MS);
  });
}

export function fetchHoles() {
  return settle({ count: PLACEHOLDER_HOLES.length, holes: PLACEHOLDER_HOLES });
}

export function fetchHole(holeId) {
  const hole = PLACEHOLDER_HOLES.find((item) => item.hole_id === holeId);
  if (!hole) {
    return Promise.reject(new Error(`Hole ${holeId} not found`));
  }
  return settle(hole);
}

export function fetchIntervals(holeId, { minConfidence } = {}) {
  const rows = PLACEHOLDER_INTERVALS[holeId];
  if (!rows) {
    return Promise.reject(new Error(`No intervals found for ${holeId}`));
  }
  const intervals =
    minConfidence == null
      ? rows
      : rows.filter((row) => row.confidence_error <= minConfidence);
  return settle({ hole_id: holeId, count: intervals.length, intervals });
}

/* Figures quoted on the landing page. These are the real counts from the
   sprint 2 run over the twenty holes we pulled, not placeholder numbers, so
   update them when the dataset grows rather than guessing. */
export const PROJECT_FIGURES = {
  holesProcessed: 20,
  depthIntervals: 276,
  mineralsDetected: 13,
  classifierRules: 5,
};

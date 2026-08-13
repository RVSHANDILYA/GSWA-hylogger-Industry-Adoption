def classify_interval(row):
    total = row.get("_total_n", 0)
    
    if total < 20:
        return {
            "label": "Unclassified",
            "confidence": 0.25,
            "reason": f"Total scan count too low (n={total:.0f}). Flagged for expert review."
        }

    wm = row.get("WHITE-MICA", 0)
    ch = row.get("CHLORITE", 0)
    he = row.get("HEMATITE", 0)
    ka = row.get("KAOLIN", 0)
    go = row.get("GOETHITE", 0)

    if wm >= 40 and ch >= 25:
        margin = min(wm - 40, ch - 25)
        confidence = max(0.55, min(0.95, 0.62 + margin / 120))
        return {
            "label": "Altered zone",
            "confidence": round(confidence, 2),
            "reason": f"White mica ({wm:.0f}%) and chlorite ({ch:.0f}%) both above phyllic alteration thresholds (40% and 25%)."
        }

    if he >= 15 and ch >= 15:
        margin = min(he - 15, ch - 15)
        confidence = max(0.5, min(0.92, 0.58 + margin / 100))
        return {
            "label": "Possible ore zone",
            "confidence": round(confidence, 2),
            "reason": f"Hematite ({he:.0f}%) and chlorite ({ch:.0f}%) both exceed thresholds associated with mineralised zones."
        }

    if (ka + go) >= 55 and wm < 15:
        margin = (ka + go) - 55
        confidence = max(0.5, min(0.9, 0.6 + margin / 100))
        return {
            "label": "Waste rock",
            "confidence": round(confidence, 2),
            "reason": f"Kaolin and goethite dominate ({ka+go:.0f}% combined) with low white mica ({wm:.0f}%)."
        }

    return {
        "label": "Unclassified",
        "confidence": 0.4,
        "reason": "No rule threshold met. Flagged for expert review."
    }

if __name__ == "__main__":
    test = {"WHITE-MICA": 48, "CHLORITE": 31, "HEMATITE": 5, "KAOLIN": 8, "GOETHITE": 4, "_total_n": 400}
    result = classify_interval(test)
    print(result)

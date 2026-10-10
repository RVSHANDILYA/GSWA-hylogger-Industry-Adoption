// Retain every API field. Raw mineral names remain available in the JSON column.
const FIELDS = ["hole_id","depth_from_m","depth_to_m","label","confidence","reason","rule_fired","final_mask","confidence_error","minerals"];
function cell(value) {
 let text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
 // Prefix spreadsheet formula strings while preserving numeric cells.
 if (typeof value === "string" && /^[\s]*[=+\-@]/.test(text)) text="'"+text;
 return '"'+text.replaceAll('"','""')+'"';
}
export function intervalsCsv(holeId,intervals) {
 return FIELDS.join(",")+"\r\n"+intervals.map(row=>FIELDS.map(field=>cell(field==="hole_id"?holeId:row[field])).join(",")).join("\r\n");
}
export default function exportIntervals(holeId,intervals) {
 const url=URL.createObjectURL(new Blob(["\uFEFF",intervalsCsv(holeId,intervals)],{type:"text/csv;charset=utf-8;"}));
 const link=document.createElement("a");
 link.href=url; link.download=holeId.replace(/[^a-zA-Z0-9_-]/g,"_")+"-filtered-intervals.csv";
 document.body.append(link); link.click(); link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
